import { Result } from 'neverthrow'
import { BytesT } from './_types'
import { BufferReaderT } from '@radixdlt/util'

const LENGTH_BYTES = 2

const fromBufferReader = (bufferReader: BufferReaderT): Result<BytesT, Error> =>
	bufferReader
		.readNextBuffer(LENGTH_BYTES)
		.map(b => b.readUInt16BE())
		.andThen((length: number) =>
			bufferReader.readNextBuffer(length).map(data => ({
				length,
				data,
			})),
		)
		.map(partial => {
			const buffer = Buffer.concat([
				Buffer.from([partial.length]),
				partial.data,
			])
			return {
				...partial,
				toBuffer: () => buffer,
				toString: () => `0x${partial.data.toString('hex')}`,
			}
		})

export const Bytes = {
	fromBufferReader,
}
