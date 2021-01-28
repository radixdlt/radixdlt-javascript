import { TransferTokensAction } from './_types'
import { Address } from '@radixdlt/crypto'
import { PositiveAmount } from '@radixdlt/primitives'
import { ResourceIdentifier } from '@radixdlt/atom'
import { v4 as uuidv4 } from 'uuid'

export type TransferTokensActionInput = Readonly<{
	to: Address
	from: Address
	amount: PositiveAmount
	resourceIdentifier: ResourceIdentifier
	message?: string
	uuid?: string
}>

export const transferTokensAction = (
	input: TransferTokensActionInput,
): TransferTokensAction => {
	const uuid = input.uuid ?? uuidv4()

	return {
		recipient: input.to,
		sender: input.from,
		tokenResourceIdentifier: input.resourceIdentifier,
		message: input.message,
		amount: input.amount,
		uuid: uuid,
	}
}
