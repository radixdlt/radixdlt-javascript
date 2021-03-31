import { Decoder, JSONDecoding } from '@radixdlt/data-formats'
import { isObject } from '@radixdlt/util'
import { ActionType, ExecutedStakeTokensAction } from './_types'
import { ok } from 'neverthrow'
import { Amount, isAmount } from '@radixdlt/primitives'
import { Address } from '@radixdlt/account'

const isExecutedStakeTokensAction = (
	something: unknown,
): something is ExecutedStakeTokensAction => {
	const inspection = something as ExecutedStakeTokensAction
	return (
		inspection.type === ActionType.STAKE_TOKENS &&
		Address.isAddress(inspection.validator) &&
		isAmount(inspection.amount)
	)
}

const JSONDecoder: Decoder = (value) =>
	isObject(value) &&
	value['type'] === ActionType.STAKE_TOKENS &&
	isExecutedStakeTokensAction(value)
		? ok(value)
		: undefined

const decoding = JSONDecoding.withDependencies(Amount, Address)
	.withDecoders(JSONDecoder)
	.create()

export const ExecutedStakeTokens = {
	...decoding,
	JSONDecoder,
}
