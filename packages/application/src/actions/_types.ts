import { AddressOrUnsafeInput, AddressT } from '@radixdlt/account'
import { AmountOrUnsafeInput, AmountT } from '@radixdlt/primitives'
import { ResourceIdentifierT } from '../dto/_types'
import { ResourceIdentifierOrUnsafeInput } from '../dto/resourceIdentifier'

export enum ActionType {
	TOKEN_TRANSFER = 'TokenTransfer',
	STAKE_TOKENS = 'StakeTokens',
	UNSTAKE_TOKENS = 'UnstakeTokens',
	OTHER = 'OTHER',
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
	validator: AddressOrUnsafeInput
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
	to: AddressT
	amount: AmountT
	tokenIdentifier: ResourceIdentifierT
}>

export type StakeAndUnstakeTokensProps = Readonly<{
	validator: AddressT
	amount: AmountT
}>

export type StakeTokensProps = StakeAndUnstakeTokensProps
export type UnstakeTokensProps = StakeAndUnstakeTokensProps

// An intended action specified by the user. Not yet accepted by
// Radix Core API.
export type IntendedActionBase<T extends ActionType> = Action<T> &
	Readonly<{
		// An ephemeral, client-side randomly generated, id
		// useful for debugging purposes. Note that this is
		// PER action, not per transactionIntent.
		from: AddressT
		uuid: string
	}>

export type IntendedTransferTokensAction = IntendedActionBase<ActionType.TOKEN_TRANSFER> &
	TransferTokensProps

export type IntendedStakeTokensAction = IntendedActionBase<ActionType.STAKE_TOKENS> &
	StakeTokensProps

export type IntendedUnstakeTokensAction = IntendedActionBase<ActionType.UNSTAKE_TOKENS> &
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
	// 'tokenIdentifier' is called 'rri' in history...
	Omit<IntendedTransferTokensAction, 'uuid' | 'tokenIdentifier'> &
	Readonly<{
		rri: ResourceIdentifierT
	}>

export type ExecutedStakeTokensAction = ExecutedActionBase<ActionType.STAKE_TOKENS> &
	Omit<IntendedStakeTokensAction, 'uuid'>

export type ExecutedUnstakeTokensAction = ExecutedActionBase<ActionType.UNSTAKE_TOKENS> &
	Omit<IntendedUnstakeTokensAction, 'uuid'>

// OTHER (Only "Executed")
export type ExecutedOtherAction = ExecutedActionBase<ActionType.OTHER>

export type ExecutedAction =
	| ExecutedTransferTokensAction
	| ExecutedStakeTokensAction
	| ExecutedUnstakeTokensAction
	| ExecutedOtherAction
