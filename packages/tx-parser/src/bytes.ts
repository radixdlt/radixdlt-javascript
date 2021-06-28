import { Result } from 'neverthrow'
import { BytesT } from './_types'
import { BufferReaderT } from '@radixdlt/util'

const fromBufferReader = (bufferReader: BufferReaderT): Result<BytesT, Error> =>
	bufferReader
		.readNextBuffer(1)
		.map(b => b.readUInt8(0))
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
