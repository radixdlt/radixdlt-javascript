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

export type TransferTokensAction = UserAction &
	Readonly<{
		recipient: Address
		amount: PositiveAmount
		tokenResourceIdentifier: ResourceIdentifier
		message?: string
		uuid: string
	}>
