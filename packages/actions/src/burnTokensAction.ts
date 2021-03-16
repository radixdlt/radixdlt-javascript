import {
	BurnTokensActionT,
	BurnTokensActionInput,
	UserActionType,
} from './_types'
import { v4 as uuidv4 } from 'uuid'
import { Decoder, JSONDecoding } from '@radixdlt/data-formats'
import { ResourceIdentifier } from '@radixdlt/atom'
import { Amount } from '@radixdlt/primitives'
import { Address } from '@radixdlt/account'
import { isObject } from '@radixdlt/util'
import { ok } from 'neverthrow'

const JSONDecoder: Decoder = (value) =>
	isObject(value) && value['type'] === UserActionType.BURN_TOKENS
		? ok(create(value as BurnTokensActionInput))
		: undefined

const decoding = JSONDecoding.withDependencies(
	ResourceIdentifier,
	Amount,
	Address,
)
	.withDecoders(JSONDecoder)
	.create()

const create = (input: BurnTokensActionInput): BurnTokensActionT => {
	const uuid = input.uuid ?? uuidv4()

	return {
		actionType: UserActionType.BURN_TOKENS,
		sender: input.burner,
		resourceIdentifier: input.resourceIdentifier,
		amount: input.amount,
		uuid: uuid,
	}
}

export const BurnTokensAction = {
	create,
	...decoding,
	JSONDecoder,
}
