import { err, Result, combineWithAllErrors, ok } from 'neverthrow'
import { AccountAddress, AccountAddressT, ResourceIdentifier, ResourceIdentifierT, ValidatorAddress, ValidatorAddressT } from '@radixdlt/account'
import { MessageEncryption } from '@radixdlt/crypto'
import { Amount, AmountT } from "@radixdlt/primitives"
import { pipe } from 'ramda'
import { firstValueFrom } from 'rxjs'
import { AccountT } from '../_types'
import { ActionType } from '../actions'

type primitiveFrom<Complex> = {
  [Property in keyof Complex]: Complex[Property] extends { toPrimitive: () => unknown }
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

type PrimitiveTransfer = Omit<primitiveFrom<Action.Transfer>, 'from' | 'amount'> & { amount: string }
type PrimitiveStake = primitiveFrom<Action.Stake>
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
    (recipientResult: Result<[Action[], AccountAddressT], Error[]>) => recipientResult.map(async ([actions, recipient]) => ({
      actions,
      message:
        message?.encrypt ?
          (await firstValueFrom(
            sender.encrypt({
              plaintext: message.plaintext,
              publicKeyOfOtherParty: recipient.publicKey
            }))
          ).combined()
          : message?.plaintext ? MessageEncryption.encodePlaintext(message.plaintext)
            : undefined
    }))
  )().mapErr(err => err.flat())

export const createTransfer = (input: Omit<primitiveFrom<Action.Transfer>, 'type' | 'amount'> & { amount: string }): Result<Action.Transfer, Error[]> =>
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

export const createStake = (input: Omit<primitiveFrom<Action.Stake>, 'type'>): Result<Action.Stake, Error[]> =>
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

export const createUnstake = (input: Omit<primitiveFrom<Action.Unstake>, 'type'>): Result<Action.Unstake, Error[]> =>
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

const getRecipients = (actions: Action[]) => actions.reduce(
  (accounts, action) => action.type === ActionType.TRANSFER ? accounts.concat(accounts, action.to) : accounts,
  [] as AccountAddressT[]
)

