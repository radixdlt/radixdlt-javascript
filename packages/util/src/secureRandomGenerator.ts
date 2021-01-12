import { SecureRandom } from './_types'
import { Result, ok, err } from 'neverthrow'

/**
 * randomBytes
 *
 * Uses JS-native CSPRNG to generate a specified number of bytes.
 *
 * @param {number} byteCount number of bytes to generate
 * @returns {Result<Buffer, Error>} result of random byte generation.
 */
// eslint-disable-next-line complexity
const randomBytes = (byteCount: number): Result<Buffer, Error> => {
	if (
		typeof window !== 'undefined' &&
		window.crypto &&
		window.crypto.getRandomValues
	) {
		const bytes = window.crypto.getRandomValues(new Uint8Array(byteCount))
		return ok(Buffer.from(bytes))
	} else if (typeof require !== 'undefined') {
		const buffer = Buffer.allocUnsafe(byteCount)
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-var-requires
		const sodium = require('sodium-native')
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
		sodium.randombytes_buf(buffer)
		return ok(buffer)
	} else {
		return err(new Error('Unable to generate safe random numbers.'))
	}
}

export const secureRandomGenerator: SecureRandom = {
	randomSecureBytes: (byteCount: number) =>
		randomBytes(byteCount)._unsafeUnwrap(),
}
