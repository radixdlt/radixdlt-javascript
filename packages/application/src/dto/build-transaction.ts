import { err, Result, combineWithAllErrors, ok } from 'neverthrow'
import { AccountAddress, AccountAddressT, ResourceIdentifier, ResourceIdentifierT, ValidatorAddress, ValidatorAddressT } from 'packages/account'
import { MessageEncryption } from 'packages/crypto/src/encryption'
import { Amount, AmountT } from "packages/primitives"
import { pipe } from 'ramda'
import { firstValueFrom } from 'rxjs'
import { AccountT } from '../_types'

type primitiveFrom<Complex> = {
  [Property in keyof Complex]: Complex[Property] extends { toPrimitive: () => unknown }
  ? ReturnType<Complex[Property]['toPrimitive']>
  : Complex[Property]
}

export enum ActionType {
  TRANSFER = 'Transfer',
  STAKE = 'Stake',
  UNSTAKE = 'Unstake',
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

type PrimitiveTransfer = Omit<primitiveFrom<Action.Transfer>, 'from'>
type PrimitiveStake = primitiveFrom<Action.Stake>
type PrimitiveUnstake = Action.Action<ActionType.UNSTAKE> & Omit<PrimitiveStake, 'type'>

type PrimitiveAction = PrimitiveTransfer | PrimitiveStake | PrimitiveUnstake
type Action = Action.Transfer | Action.Stake | Action.Unstake

export const buildTransaction = (...primitiveActions: PrimitiveAction[]) => (sender: AccountT, message?: Message) =>
  pipe(
    () => primitiveActions.map(
      action =>
        action.type === ActionType.TRANSFER ? createTransfer({ from: sender.address.toPrimitive(), ...action }) :
        action.type === ActionType.STAKE ? createStake(action) :
        action.type === ActionType.UNSTAKE ? createUnstake(action) :
        err([Error('Unknown action type.')])
    ),
    actionResult => combineWithAllErrors(actionResult).andThen(
      actions => (
        recipients => recipients.length > 1 ?
          err([Error('Found more than one recipient in transaction. This is not supported.')]) :
          ok([actions, recipients[0]])
      )(
        getRecipients(actions)
      )
    ),
    recipientResult => recipientResult.map(async ([actions, recipient]) => ({
      actions,
      message:
        message?.encrypt ?
          (await firstValueFrom(
            sender.encrypt({
              plaintext: message.plaintext,
              publicKeyOfOtherParty: (recipient as AccountAddressT).publicKey
            }))
          ).combined()
          : message?.plaintext ? MessageEncryption.encodePlaintext(message.plaintext)
          : undefined
    }))
  )().mapErr(err => err.flat())

const createTransfer = (input: primitiveFrom<Action.Transfer>): Result<Action.Transfer, Error[]> =>
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

const createStake = (input: primitiveFrom<Action.Stake>): Result<Action.Stake, Error[]> =>
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

const createUnstake = (input: primitiveFrom<Action.Unstake>): Result<Action.Unstake, Error[]> =>
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

