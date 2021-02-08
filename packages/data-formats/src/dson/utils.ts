import { DSONEncoding } from './dson'
import { DSONCodable } from './_types'
import { Byte, byteToBuffer } from '@radixdlt/util'

export const DSONObjectEncoding = (input: {
	prefix: Byte
	buffer: Buffer
}): DSONCodable =>
	DSONEncoding(undefined)(() =>
		Buffer.concat([byteToBuffer(input.prefix), input.buffer]),
	)
