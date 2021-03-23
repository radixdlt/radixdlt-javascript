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
	uuid: string
}>

export type TokensActionBase<T> = UserAction<T> &
	Readonly<{
		amount: AmountT
		resourceIdentifier: ResourceIdentifierT
	}>

export type TransferTokensActionT = TokensActionBase<UserActionType.TOKEN_TRANSFER> &
	Readonly<{
		recipient: AddressT
		message?: string
	}>

export type BurnTokensActionT = TokensActionBase<UserActionType.BURN_TOKENS>

export type TokensActionBaseInput = Readonly<{
	amount: AmountT
	resourceIdentifier: ResourceIdentifierT
	uuid?: string
}>

export type TransferTokensActionInput = TokensActionBaseInput &
	Readonly<{
		to: AddressT
		from: AddressT
		message?: string
	}>

export type BurnTokensActionInput = TokensActionBaseInput &
	Readonly<{
		burner: AddressT
	}>
