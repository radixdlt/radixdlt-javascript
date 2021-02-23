import { AddressT } from '@radixdlt/account'
import { AmountT } from '@radixdlt/primitives'
import { ResourceIdentifierT } from '@radixdlt/atom'

export enum UserActionType {
	TOKEN_TRANSFER = 'TokenTransfer',
	BURN_TOKENS = 'BurnTokens',
}

export type UserAction = Readonly<{
	actionType: UserActionType
	sender: AddressT
	uuid: string
}>

export type TokensActionBase = UserAction &
	Readonly<{
		amount: AmountT
		resourceIdentifier: ResourceIdentifierT
	}>

export type TransferTokensAction = TokensActionBase &
	Readonly<{
		actionType: UserActionType.TOKEN_TRANSFER
		recipient: AddressT
		message?: string
	}>

export type BurnTokensAction = TokensActionBase &
	Readonly<{
		actionType: UserActionType.BURN_TOKENS
	}>

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
