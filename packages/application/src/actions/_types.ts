import { AddressT } from '@radixdlt/account'
import { AmountT } from '@radixdlt/primitives'
import { ResourceIdentifierT, TransactionIdentifierT } from '../dto/_types'

export enum ActionType {
	TOKEN_TRANSFER = 'TokenTransfer',
	STAKE_TOKENS = 'StakeTokens',
	UNSTAKE_TOKENS = 'UnstakeTokens',
	OTHER = 'OTHER',
}

export type Action<T extends ActionType = ActionType.OTHER> = Readonly<{
	type: T
}>

// An intended action specified by the user. Not yet accepted by
// Radix Core API.
export type IntendedActionBase<T extends ActionType> = Action<T> &
	Readonly<{
		// An ephemeral, client-side randomly generated, id
		// useful for debugging purposes. Note that this is
		// PER action, not per transactionIntent.
		uuid: string
	}>

// An executed action stored in the Radix Ledger, part
// of transaction history. Marker type.
export type ExecutedActionBase<T extends ActionType> = Action<T> &
	Readonly<{
		// Nothing here.
	}>

// TRANSFER
export type TransferTokensProps = Readonly<{
	from: AddressT
	to: AddressT
	amount: AmountT
	resourceIdentifier: ResourceIdentifierT
}>

export type InputIntendedAction = Readonly<{
	uuid?: string
}>

export type IntendedTransferTokensInput = TransferTokensProps &
	InputIntendedAction

export type IntendedTransferTokensAction = IntendedActionBase<ActionType.TOKEN_TRANSFER> &
	TransferTokensProps
export type ExecutedTransferTokensAction = ExecutedActionBase<ActionType.TOKEN_TRANSFER> &
	TransferTokensProps

// STAKE

export type StakingProps = Readonly<{
	validator: AddressT
	amount: AmountT
}>

export type IntendedStakeTokensInput = StakingProps & InputIntendedAction

// Unstake action has same input as stake.
export type IntendedUnstakeTokensInput = IntendedStakeTokensInput

export type StakePosition = StakingProps

export type IntendedStakeTokensAction = IntendedActionBase<ActionType.STAKE_TOKENS> &
	StakingProps

export type ExecutedStakeTokensAction = ExecutedActionBase<ActionType.STAKE_TOKENS> &
	StakingProps

// UNSTAKE
export type UnstakingProps = StakingProps &
	Readonly<{
		withdrawalTxID: TransactionIdentifierT
		epochsUntil: number
	}>

export type UnstakePosition = UnstakingProps

export type IntendedUnstakeTokensAction = IntendedActionBase<ActionType.UNSTAKE_TOKENS> &
	StakingProps // Initiated unstakes have same props as stakes.

export type ExecutedUnstakeTokensAction = ExecutedActionBase<ActionType.UNSTAKE_TOKENS> &
	UnstakingProps

// OTHER (Only "Executed")
export type ExecutedOtherAction = ExecutedActionBase<ActionType.OTHER>

export type IntendedAction =
	| IntendedTransferTokensAction
	| IntendedStakeTokensAction
	| IntendedUnstakeTokensAction
export type ExecutedAction =
	| ExecutedTransferTokensAction
	| ExecutedStakeTokensAction
	| ExecutedUnstakeTokensAction
	| ExecutedOtherAction
