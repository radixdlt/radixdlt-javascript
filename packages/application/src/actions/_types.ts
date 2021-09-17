import {
	AddressOrUnsafeInput,
	AccountAddressT,
	ValidatorAddressT,
	ValidatorAddressOrUnsafeInput,
	ResourceIdentifierOrUnsafeInput,
	ResourceIdentifierT,
} from '@radixdlt/account'
import { AmountOrUnsafeInput, AmountT } from '@radixdlt/primitives'

export enum ActionType {
	TOKEN_TRANSFER = 'TokenTransfer',
	STAKE_TOKENS = 'StakeTokens',
	UNSTAKE_TOKENS = 'UnstakeTokens',
	OTHER = 'Other',
}

export type Action<T extends ActionType = ActionType.OTHER> = Readonly<{
	type: T
}>

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
export type TransferTokensProps = Readonly<{
	to: AccountAddressT
	from: AccountAddressT
	amount: AmountT
	rri: ResourceIdentifierT
}>

export type TransferTokensAction = TransferTokensProps &
	Action<ActionType.TOKEN_TRANSFER>

export type StakeTokensProps = Readonly<{
	from: AccountAddressT
	validator: ValidatorAddressT
	amount: AmountT
}>

export type UnstakeTokensProps = Readonly<{
	to: AccountAddressT
	validator: ValidatorAddressT
	amount: AmountT
}>

export type StakeTokensAction = StakeTokensProps &
	Action<ActionType.STAKE_TOKENS>
export type UnstakeTokensAction = UnstakeTokensProps &
	Action<ActionType.UNSTAKE_TOKENS>

// An intended action specified by the user. Not yet accepted by
// Radix Core API.
export type IntendedActionBase<T extends ActionType> = Action<T> &
	Readonly<{
		from: AccountAddressT
	}>

export type IntendedTransferTokensAction = IntendedActionBase<ActionType.TOKEN_TRANSFER> &
	TransferTokensAction

export type IntendedStakeTokensAction = IntendedActionBase<ActionType.STAKE_TOKENS> &
	StakeTokensProps

export type IntendedUnstakeTokensAction = Action<ActionType.UNSTAKE_TOKENS> &
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

export type ExecutedTransferTokensAction = ExecutedActionBase<ActionType.TOKEN_TRANSFER> &
	TransferTokensAction

export type ExecutedStakeTokensAction = ExecutedActionBase<ActionType.STAKE_TOKENS> &
	StakeTokensAction

export type ExecutedUnstakeTokensAction = ExecutedActionBase<ActionType.UNSTAKE_TOKENS> &
	UnstakeTokensAction

// OTHER (Only "Executed")
export type ExecutedOtherAction = ExecutedActionBase<ActionType.OTHER>

export type ExecutedAction =
	| ExecutedTransferTokensAction
	| ExecutedStakeTokensAction
	| ExecutedUnstakeTokensAction
	| ExecutedOtherAction
