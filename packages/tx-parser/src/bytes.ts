import { Result } from 'neverthrow'
import { BytesT, BufferReaderT } from './_types'

const fromBufferReader = (bufferReader: BufferReaderT): Result<BytesT, Error> =>
	bufferReader
		.readNextBuffer(1)
		.map(b => b.readUInt8())
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
				toString: () => buffer.toString('hex'),
			}
		})

export const Bytes = {
	fromBufferReader,
}
