import {
	BurnTokensActionT,
	BurnTokensActionInput,
	UserActionType,
} from './_types'
import { v4 as uuidv4 } from 'uuid'
import { Decoder, JSONDecoding } from '@radixdlt/data-formats'
import { ResourceIdentifier } from 'packages/atom/src/resourceIdentifier'
import { Amount } from 'packages/primitives/src/amount'
import { Address } from 'packages/account/src/address'
import { isObject } from '@radixdlt/util'
import { ok } from 'neverthrow'

const JSONDecoder: Decoder = (value, key) =>
	isObject(value) && value['actionType'] === UserActionType.BURN_TOKENS
	? ok(create(value))
	: undefined

const decoding = JSONDecoding
	.withDependencies(
		ResourceIdentifier,
		Amount,
		Address,
	)
	.withDecoders()

export const create = (
	input: BurnTokensActionInput,
): BurnTokensActionT => {
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

}
