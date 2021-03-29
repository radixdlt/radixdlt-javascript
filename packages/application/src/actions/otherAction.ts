import { Decoder, JSONDecoding } from '@radixdlt/data-formats'
import { isObject } from '@radixdlt/util'
import { ActionType, ExecutedOtherAction } from './_types'
import { ok } from 'neverthrow'

const JSONDecoder: Decoder = (value) =>
	isObject(value) && value['type'] === ActionType.OTHER
		? ok(value as ExecutedOtherAction)
		: undefined

const decoding = JSONDecoding.withDecoders(JSONDecoder).create()

export const OtherAction = {
	...decoding,
	JSONDecoder,
}
