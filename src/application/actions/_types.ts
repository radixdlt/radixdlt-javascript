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
	TRANSFER = 'TokenTransfer',
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
	to: AddressOrUnsafeInput
	amount: AmountOrUnsafeInput
	tokenIdentifier: ResourceIdentifierOrUnsafeInput
}>

// Same input for stake/unstake for now
export type StakeAndUnstakeTokensInput = Readonly<{
	validator: ValidatorAddressOrUnsafeInput
	amount: AmountOrUnsafeInput
}>

export type StakeTokensInput = StakeAndUnstakeTokensInput
export type UnstakeTokensInput = StakeAndUnstakeTokensInput

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
	to: AccountAddressT
	from: AccountAddressT
	amount: AmountT
	rri: ResourceIdentifierT
}

export type TransferTokensAction = TransferTokensProps &
	Action<ActionType.TRANSFER>

export type StakeAndUnstakeTokensProps = {
	from: AccountAddressT
	validator: ValidatorAddressT
	amount: AmountT
}

export type StakeTokensProps = StakeAndUnstakeTokensProps
export type UnstakeTokensProps = StakeAndUnstakeTokensProps

export type StakeTokensAction = StakeTokensProps &
	Action<ActionType.STAKE>
export type UnstakeTokensAction = UnstakeTokensProps &
	Action<ActionType.UNSTAKE>

// An intended action specified by the user. Not yet accepted by
// Radix Core API.
export type IntendedActionBase<T extends ActionType> = Action<T> &
	Readonly<{
		from: AccountAddressT
	}>

export type IntendedTransferTokensAction = IntendedActionBase<ActionType.TRANSFER> &
	TransferTokensAction

export type IntendedStakeTokensAction = IntendedActionBase<ActionType.STAKE> &
	StakeTokensProps

export type IntendedUnstakeTokensAction = IntendedActionBase<ActionType.UNSTAKE> &
	UnstakeTokensProps

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

export type ExecutedTransferTokensAction = ExecutedActionBase<ActionType.TRANSFER> &
	TransferTokensAction

export type ExecutedStakeTokensAction = ExecutedActionBase<ActionType.STAKE> &
	StakeTokensAction

export type ExecutedUnstakeTokensAction = ExecutedActionBase<ActionType.UNSTAKE> &
	UnstakeTokensAction

// OTHER (Only "Executed")
export type ExecutedOtherAction = ExecutedActionBase<ActionType.OTHER>

export type ExecutedAction =
	| ExecutedTransferTokensAction
	| ExecutedStakeTokensAction
	| ExecutedUnstakeTokensAction
	| ExecutedOtherAction