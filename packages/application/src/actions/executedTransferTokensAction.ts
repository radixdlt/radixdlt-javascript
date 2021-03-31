import { ActionType, ExecutedTransferTokensAction } from './_types'
import { Address } from '@radixdlt/account'
import { Amount, isAmount } from '@radixdlt/primitives'
import {
	isResourceIdentifier,
	ResourceIdentifier,
} from '../dto/resourceIdentifier'
import { Decoder, JSONDecoding } from '@radixdlt/data-formats'
import { isObject } from '@radixdlt/util'
import { ok } from 'neverthrow'

const isExecutedTransferTokensAction = (
	something: unknown,
): something is ExecutedTransferTokensAction => {
	const inspection = something as ExecutedTransferTokensAction
	return (
		inspection.type === ActionType.TOKEN_TRANSFER &&
		Address.isAddress(inspection.from) &&
		Address.isAddress(inspection.to) &&
		isAmount(inspection.amount) &&
		isResourceIdentifier(inspection.rri)
	)
}

const JSONDecoder: Decoder = (value) =>
	isObject(value) &&
	value['type'] === ActionType.TOKEN_TRANSFER &&
	isExecutedTransferTokensAction(value)
		? ok(value)
		: undefined

const decoding = JSONDecoding.withDependencies(
	ResourceIdentifier,
	Amount,
	Address,
)
	.withDecoders(JSONDecoder)
	.create()

export const ExecutedTransferTokens = {
	...decoding,
	JSONDecoder,
}
