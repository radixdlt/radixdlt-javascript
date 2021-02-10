/* eslint-disable */
import { err, ok, Result } from 'neverthrow'

type BufferReader = {
	nextBuffer: (byteCount: number) => Result<Buffer, Error>
}
export const makeBufferReader = (buffer: Buffer): BufferReader => {
	let buf = buffer || new Buffer(0)
	if (!Buffer.isBuffer(buf)) throw new Error('A Buffer must be provided')
	let offset = 0

	return {
		nextBuffer: (byteCount: number): Result<Buffer, Error> => {
			if (byteCount < 0)
				return err(new Error(`'byteCount' must be no negative`))
			if (offset + byteCount > buf.length)
				return err(new Error(`Out of buffer's boundary`))
			let bufToReturn = new Buffer(byteCount)
			buf.copy(bufToReturn, 0, offset, offset + byteCount)
			offset += byteCount
			return ok(bufToReturn)
		},
	}
}

/* eslint-enable */
