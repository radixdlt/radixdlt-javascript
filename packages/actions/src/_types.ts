import { Address } from '@radixdlt/crypto'
import { PositiveAmount } from '@radixdlt/primitives'
import { ResourceIdentifier } from '@radixdlt/atom'

export type TransferTokensAction = Readonly<{
	sender: Address
	recipient: Address
	amount: PositiveAmount
	tokenResourceIdentifier: ResourceIdentifier
	message?: string
	uuid: string
}>
