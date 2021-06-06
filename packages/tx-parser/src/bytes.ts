import { Result } from 'neverthrow'
import { BytesT } from './_types'
import { ReadBuffer } from './transaction'

const fromReadBuffer = (readBuffer: ReadBuffer): Result<BytesT, Error> =>
	readBuffer(1)
		.map(b => b.readUInt8())
		.andThen((length: number) =>
			readBuffer(length).map(data => ({
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
	fromReadBuffer,
}
