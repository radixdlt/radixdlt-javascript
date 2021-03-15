import {
	TransferTokensActionT,
	TransferTokensActionInput,
	UserActionType,
} from './_types'
import { v4 as uuidv4 } from 'uuid'
import { Decoder, JSONDecoding } from '@radixdlt/data-formats'
import { isObject } from '@radixdlt/util'
import { ok } from 'neverthrow'
import { ResourceIdentifier } from '@radixdlt/atom'
import { Amount } from '@radixdlt/primitives'
import { Address } from '@radixdlt/account'

const JSONDecoder: Decoder = value =>
	isObject(value) && value['type'] === UserActionType.TOKEN_TRANSFER
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

const create = (
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
