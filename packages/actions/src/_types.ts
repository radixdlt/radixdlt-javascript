import { AddressT } from '@radixdlt/account'
import { AmountT } from '@radixdlt/primitives'
import { ResourceIdentifierT } from '@radixdlt/atom'

export enum UserActionType {
	TOKEN_TRANSFER = 'TokenTransfer',
	BURN_TOKENS = 'BurnTokens',
}

export type UserAction<T> = Readonly<{
	actionType: T
	sender: AddressT
}>

export type TokensActionBase<T> = UserAction<T> &
	Readonly<{
		amount: AmountT
		resourceIdentifier: ResourceIdentifierT
	}>

export type TransferTokensActionT = TokensActionBase<UserActionType.TOKEN_TRANSFER> &
	Readonly<{
		recipient: AddressT
	}>

export type BurnTokensActionT = TokensActionBase<UserActionType.BURN_TOKENS>

export type TokensActionBaseInput = Readonly<{
	amount: AmountT
	resourceIdentifier: ResourceIdentifierT
}>

export type TransferTokensActionInput = TokensActionBaseInput &
	Readonly<{
		to: AddressT
		from: AddressT
	}>

export type BurnTokensActionInput = TokensActionBaseInput &
	Readonly<{
		burner: AddressT
	}>
