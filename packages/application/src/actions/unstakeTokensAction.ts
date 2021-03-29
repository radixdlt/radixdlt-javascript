import { Decoder, JSONDecoding } from '@radixdlt/data-formats'
import { isObject } from '@radixdlt/util'
import {
	ActionType,
	ExecutedUnstakeTokensAction,
	IntendedUnstakeTokensAction,
	IntendedUnstakeTokensInput,
} from './_types'
import { ok } from 'neverthrow'
import { Amount } from '@radixdlt/primitives'
import { Address } from '@radixdlt/account'
import { v4 as uuidv4 } from 'uuid'

const JSONDecoder: Decoder = (value) =>
	isObject(value) && value['type'] === ActionType.UNSTAKE_TOKENS
		? ok(create(value as ExecutedUnstakeTokensAction))
		: undefined

const decoding = JSONDecoding.withDependencies(Amount, Address)
	.withDecoders(JSONDecoder)
	.create()

const create = (
	input: IntendedUnstakeTokensInput,
): IntendedUnstakeTokensAction => {
	const uuid = input.uuid ?? uuidv4()

	return {
		type: ActionType.UNSTAKE_TOKENS,
		validator: input.validator,
		amount: input.amount,
		uuid: uuid,
	}
}

export const UnstakeTokensAction = {
	create,
	...decoding,
	JSONDecoder,
}
