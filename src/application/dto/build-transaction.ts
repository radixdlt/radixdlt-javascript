import { err, Result, combineWithAllErrors, ok } from 'neverthrow'
import { AccountAddress, AccountAddressT, ResourceIdentifier, ResourceIdentifierT, ValidatorAddress, ValidatorAddressT } from '@account'
import { Message } from '@crypto'
import { Amount, AmountT } from "@primitives"
import { pipe } from 'ramda'
import { firstValueFrom } from 'rxjs'
import { AccountT } from '../_types'

export enum ActionType {
	TRANSFER = 'TokenTransfer',
	STAKE = 'StakeTokens',
	UNSTAKE = 'UnstakeTokens',
	OTHER = 'Other',
}

export type PrimitiveFrom<Complex> = {
  [Property in keyof Complex]: 
    Complex[Property] extends { toPrimitive: () => unknown }
    ? ReturnType<Complex[Property]['toPrimitive']>
    : Complex[Property]
}

export namespace Action {
  export type Action<T extends ActionType> = {
    type: T
  }

  export type Transfer = Action<ActionType.TRANSFER> & {
    from: AccountAddressT,
    to: AccountAddressT,
    amount: AmountT,
    rri: ResourceIdentifierT,
  }

  export type Stake = Action<ActionType.STAKE> & {
    validator: ValidatorAddressT,
    amount: AmountT,
    from: AccountAddressT
  }

  export type Unstake = Action<ActionType.UNSTAKE> & Omit<Stake, 'type'>
}

type Message = {
  plaintext: string,
  encrypt: boolean
}

type PrimitiveTransfer = Omit<PrimitiveFrom<Action.Transfer>, 'from' | 'amount'> & { amount: string }
type PrimitiveStake = PrimitiveFrom<Action.Stake>
type PrimitiveUnstake = Action.Action<ActionType.UNSTAKE> & Omit<PrimitiveStake, 'type'>

type PrimitiveAction = PrimitiveTransfer | PrimitiveStake | PrimitiveUnstake
export type Action = Action.Transfer | Action.Stake | Action.Unstake

export const buildTransaction = (...actions: Action[]) => (sender: AccountT, message?: Message) =>
  pipe(
    () => {
      const recipients = getRecipients(actions)

      return recipients.length > 1 ?
        err([Error('Found more than one recipient in transaction. This is not supported.')]) :
        ok([actions, recipients[0]] as [Action[], AccountAddressT])
    },
    (recipientResult: Result<[Action[], AccountAddressT], Error[]>) => recipientResult.asyncMap(async ([actions, recipient]) => ({
      actions,
      message:
        message?.encrypt ?
          (await firstValueFrom(
            sender.encrypt({
              plaintext: message.plaintext,
              publicKeyOfOtherParty: recipient.publicKey
            }))
          ).combined()
          : message?.plaintext ? Message.createPlaintext(message.plaintext).bytes
            : undefined
    }))
  )().mapErr(err => err.flat())

export const createTransfer = (input: Omit<PrimitiveFrom<Action.Transfer>, 'type' | 'amount'> & { amount: string }): Result<Action.Transfer, Error[]> =>
  combineWithAllErrors([
    AccountAddress.fromUnsafe(input.from),
    AccountAddress.fromUnsafe(input.to),
    Amount.fromUnsafe(input.amount),
    ResourceIdentifier.fromUnsafe(input.rri),
  ]).map(
    (results) => ({
      from: results[0] as AccountAddressT,
      to: results[1] as AccountAddressT,
      amount: results[2] as AmountT,
      rri: results[3] as ResourceIdentifierT,
      type: ActionType.TRANSFER,
    })
  )

export const createStake = (input: Omit<PrimitiveStake, 'type'>): Result<Action.Stake, Error[]> =>
  combineWithAllErrors([
    ValidatorAddress.fromUnsafe(input.validator),
    Amount.fromUnsafe(input.amount),
    AccountAddress.fromUnsafe(input.from)
  ]).map(
    (results) => ({
      validator: results[0] as ValidatorAddressT,
      amount: results[1] as AmountT,
      from: results[2] as AccountAddressT,
      type: ActionType.STAKE,
    })
  )

export const createUnstake = (input: Omit<PrimitiveFrom<Action.Unstake>, 'type'>): Result<Action.Unstake, Error[]> =>
  combineWithAllErrors([
    ValidatorAddress.fromUnsafe(input.validator),
    Amount.fromUnsafe(input.amount),
    AccountAddress.fromUnsafe(input.from)
  ]).map(
    (results) => ({
      validator: results[0] as ValidatorAddressT,
      amount: results[1] as AmountT,
      from: results[2] as AccountAddressT,
      type: ActionType.UNSTAKE,
    })
  )

export const getRecipients = (actions: Action[]) => actions.reduce(
  (accounts, action) => 
    action.type === ActionType.TRANSFER && !accounts.some(account => account.equals(action.to))
      ? accounts.concat(accounts, action.to) 
      : accounts,
  [] as AccountAddressT[]
)

export const flatMapAddressesOf = (
	input: Readonly<{
		actions: Action[]
		includeFrom?: boolean
		includeTo?: boolean
	}>,
): AccountAddressT[] => {
	const { actions, includeFrom, includeTo } = input
	const flatMapped = actions.reduce(
		(acc: AccountAddressT[], action: Action) => {
			const uniqueAddressOfAction = getUniqueAddresses({
				action,
				includeFrom,
				includeTo,
			})
			return acc.concat(...uniqueAddressOfAction)
		},
		[] as AccountAddressT[],
	)
  const set = new Set<string>()
	return flatMapped.filter(a => {
		const str = a.toString()
		const hasNt = !set.has(str)
		set.add(str)
		return hasNt
	})
}

export const getUniqueAddresses = (
	input: Readonly<{
		action: Action
		includeFrom?: boolean
		includeTo?: boolean
	}>,
): AccountAddressT[] => {
	const action = input.action
	const includeFrom = input.includeFrom ?? true
	const includeTo = input.includeTo ?? true
	if (action.type === ActionType.TRANSFER) {
		const addresses: AccountAddressT[] = []
		if (includeTo) {
			addresses.push(action.to)
		}
		if (includeFrom) {
			addresses.push(action.from)
		}
		return addresses
	} else if (action.type === ActionType.STAKE) {
		const addresses: AccountAddressT[] = []
		if (includeFrom) {
			addresses.push(action.from)
		}
		return addresses
	} else if (action.type === ActionType.UNSTAKE) {
		const addresses: AccountAddressT[] = []
		if (includeFrom) {
			addresses.push(action.from)
		}
		return addresses
	} else {
		return []
	}
}