import { Decoder, JSONDecoding } from '@radixdlt/data-formats'
import { isObject } from '@radixdlt/util'
import { ActionType, ExecutedUnstakeTokensAction } from './_types'
import { ok } from 'neverthrow'
import { Amount, isAmount } from '@radixdlt/primitives'
import { Address } from '@radixdlt/account'

const isExecutedUnstakeTokensAction = (
	something: unknown,
): something is ExecutedUnstakeTokensAction => {
	const inspection = something as ExecutedUnstakeTokensAction
	return (
		inspection.type === ActionType.UNSTAKE_TOKENS &&
		Address.isAddress(inspection.validator) &&
		isAmount(inspection.amount)
	)
}

const JSONDecoder: Decoder = (value) =>
	isObject(value) &&
	value['type'] === ActionType.UNSTAKE_TOKENS &&
	isExecutedUnstakeTokensAction(value)
		? ok(value)
		: undefined

const decoding = JSONDecoding.withDependencies(Amount, Address)
	.withDecoders(JSONDecoder)
	.create()

export const ExecutedUnstakeTokens = {
	...decoding,
	JSONDecoder,
}
