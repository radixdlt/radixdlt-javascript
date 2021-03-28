import { Decoder, JSONDecoding } from '@radixdlt/data-formats'
import { isObject } from '@radixdlt/util'
import {
	ActionType,
	ExecutedStakeTokensAction,
	IntendedStakeTokensAction,
	IntendedStakeTokensInput,
} from './_types'
import { ok } from 'neverthrow'
import { Amount } from '@radixdlt/primitives'
import { Address } from '@radixdlt/account'
import { v4 as uuidv4 } from 'uuid'

const JSONDecoder: Decoder = (value) =>
	isObject(value) && value['type'] === ActionType.STAKE_TOKENS
		? ok(value as ExecutedStakeTokensAction)
		: undefined

const decoding = JSONDecoding.withDependencies(Amount, Address)
	.withDecoders(JSONDecoder)
	.create()

const intended = (
	input: IntendedStakeTokensInput,
): IntendedStakeTokensAction => {
	const uuid = input.uuid ?? uuidv4()

	return {
		type: ActionType.STAKE_TOKENS,
		validator: input.validator,
		amount: input.amount,
		uuid: uuid,
	}
}

export const StakeTokensAction = {
	intended,
	...decoding,
	JSONDecoder,
}
