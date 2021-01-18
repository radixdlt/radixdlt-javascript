import { Int64, Nonce } from './_types'

import Long from 'long'
import { SecureRandom, secureRandomGenerator } from '@radixdlt/util'

export const randomInt64 = (
	secureRandom: SecureRandom = secureRandomGenerator,
): Int64 => {
	const random8Bytes = secureRandom.randomSecureBytes(8)
	const bytesArray = Buffer.from(random8Bytes, 'hex')
	return Long.fromBytes(Array.from(bytesArray))
}

export const nonce = (value: Int64 | number): Nonce => {
	const int64 = Long.isLong(value) ? value : Long.fromNumber(value)
	return { value: int64 }
}

export const randomNonce = (
	secureRandom: SecureRandom = secureRandomGenerator,
): Nonce => nonce(randomInt64(secureRandom))
