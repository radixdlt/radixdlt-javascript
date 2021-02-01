import { Address } from '@radixdlt/crypto'
import { PositiveAmount } from '@radixdlt/primitives'
import { ResourceIdentifier } from '@radixdlt/atom'

export enum UserActionType {
	TOKEN_TRANSFER = 'TokenTransfer',
}

export type UserAction = Readonly<{
	actionType: UserActionType
	sender: Address
}>

export type TokensActionBase = UserAction &
	Readonly<{
		amount: PositiveAmount
		tokenResourceIdentifier: ResourceIdentifier
	}>

export type TransferTokensAction = TokensActionBase &
	Readonly<{
		recipient: Address
		message?: string
		uuid: string
	}>
