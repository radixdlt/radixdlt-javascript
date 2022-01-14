import {
  AddressOrUnsafeInput,
  AccountAddressT,
  ValidatorAddressT,
  ValidatorAddressOrUnsafeInput,
  ResourceIdentifierOrUnsafeInput,
  ResourceIdentifierT,
} from '@account'
import { AmountOrUnsafeInput, AmountT } from '@primitives'

export enum ActionType {
  TRANSFER = 'TransferTokens',
  STAKE = 'StakeTokens',
  UNSTAKE = 'UnstakeTokens',
  OTHER = 'Other',
}

export type Action<T extends ActionType = ActionType.OTHER> = {
  type: T
}

// ##################################
// ####                         #####
// ####     INPUTTED ACTIONS    #####
// ####                         #####
// ##################################

export type TransferTokensInput = Readonly<{
  to_account: AddressOrUnsafeInput
  amount: AmountOrUnsafeInput
  tokenIdentifier: ResourceIdentifierOrUnsafeInput
}>

export type StakeTokensInput = Readonly<{
  to_validator: ValidatorAddressOrUnsafeInput
  amount: AmountOrUnsafeInput
  tokenIdentifier: ResourceIdentifierOrUnsafeInput
}>

export type UnstakeTokensInput = Readonly<{
  from_validator: ValidatorAddressOrUnsafeInput
  amount: AmountOrUnsafeInput
  tokenIdentifier: ResourceIdentifierOrUnsafeInput
}>

export type ActionInput =
  | TransferTokensInput
  | StakeTokensInput
  | UnstakeTokensInput

// ##################################
// ####                         #####
// ####     INTENDED ACTIONS    #####
// ####                         #####
// ##################################
export type TransferTokensProps = {
  to_account: AccountAddressT
  from_account: AccountAddressT
  amount: AmountT
  rri: ResourceIdentifierT
}

export type TransferTokensAction = TransferTokensProps &
  Action<ActionType.TRANSFER>

export type StakeTokensProps = Readonly<{
  from_account: AccountAddressT
  to_validator: ValidatorAddressT
  amount: AmountT
  rri: ResourceIdentifierT
}>

export type UnstakeTokensProps = Readonly<{
  to_account: AccountAddressT
  from_validator: ValidatorAddressT
  amount?: AmountT
  rri?: ResourceIdentifierT
  unstake_percentage?: number
}>

export type StakeTokensAction = StakeTokensProps & Action<ActionType.STAKE>
export type UnstakeTokensAction = UnstakeTokensProps &
  Action<ActionType.UNSTAKE>

// An intended action specified by the user. Not yet accepted by
// Radix Core API.
export type IntendedActionBase<T extends ActionType> = Action<T>

export type IntendedTransferTokensAction =
  IntendedActionBase<ActionType.TRANSFER> & TransferTokensAction

export type IntendedStakeTokensAction = IntendedActionBase<ActionType.STAKE> &
  StakeTokensProps

export type IntendedUnstakeTokensAction =
  IntendedActionBase<ActionType.UNSTAKE> & UnstakeTokensProps

export type IntendedAction =
  | IntendedTransferTokensAction
  | IntendedStakeTokensAction
  | IntendedUnstakeTokensAction

// ##################################
// ####                         #####
// ####     EXECUTED ACTIONS    #####
// ####                         #####
// ##################################

// An executed action stored in the Radix Ledger, part
// of transaction history. Marker type.
export type ExecutedActionBase<T extends ActionType> = Action<T>

export type ExecutedTransferTokensAction =
  ExecutedActionBase<ActionType.TRANSFER> & TransferTokensAction

export type ExecutedStakeTokensAction = ExecutedActionBase<ActionType.STAKE> &
  StakeTokensAction

export type ExecutedUnstakeTokensAction =
  ExecutedActionBase<ActionType.UNSTAKE> & UnstakeTokensAction

// OTHER (Only "Executed")
export type ExecutedOtherAction = ExecutedActionBase<ActionType.OTHER>

export type ExecutedAction =
  | ExecutedTransferTokensAction
  | ExecutedStakeTokensAction
  | ExecutedUnstakeTokensAction
  | ExecutedOtherAction
