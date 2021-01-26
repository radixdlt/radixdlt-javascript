import { DSONEncoding } from './dson'
import { DSONCodable } from './_types'
import { Byte, byteToBuffer } from '@radixdlt/util'

export const addObjectEncoding = (input: {
	prefix: Byte
	buffer: Buffer
}): DSONCodable =>
	DSONEncoding({
		encodingMethodOrKeyValues: () =>
			Buffer.concat([byteToBuffer(input.prefix), input.buffer]),
	})
