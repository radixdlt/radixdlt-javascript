import {
	TransferTokensActionT,
	TransferTokensActionInput,
	UserActionType,
} from './_types'
import { v4 as uuidv4 } from 'uuid'
import { Decoder, JSONDecoding } from '@radixdlt/data-formats'
import { isObject } from '@radixdlt/util'
import { ok } from 'neverthrow'
import { ResourceIdentifier } from 'packages/atom/src/resourceIdentifier'
import { Amount } from 'packages/primitives/src/amount'
import { Address } from 'packages/account/src/address'

const JSONDecoder: Decoder = value =>
	isObject(value) && value['actionType'] === UserActionType.TOKEN_TRANSFER
	? ok(create(value as TransferTokensActionInput))
	: undefined

const decoding = JSONDecoding
	.withDependencies(
		ResourceIdentifier,
		Amount,
		Address,
	)
	.withDecoders(
		JSONDecoder
	)
	.create()

export const create = (
	input: TransferTokensActionInput,
): TransferTokensActionT => {
	const uuid = input.uuid ?? uuidv4()

	return {
		actionType: UserActionType.TOKEN_TRANSFER,
		recipient: input.to,
		sender: input.from,
		resourceIdentifier: input.resourceIdentifier,
		message: input.message,
		amount: input.amount,
		uuid: uuid,
	}
}

export const TransferTokensAction = {
	create,
	...decoding,
	JSONDecoder
}
