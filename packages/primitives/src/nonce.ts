import { Int64, Nonce } from './_types'

// import { Long, fromBytes } from 'long'
import Long from 'long'
import { SecureRandom, secureRandomGenerator } from '@radixdlt/util'

export const randomInt64 = (
	secureRandom: SecureRandom = secureRandomGenerator,
): Int64 => {
	const random8Bytes = secureRandom.randomSecureBytes(8)
	const bytesArray = Uint8Array.from(random8Bytes)
	return Long.fromBytes(Array.from(bytesArray))
}

export const randomNonce = (
	secureRandom: SecureRandom = secureRandomGenerator,
): Nonce => {
	return { value: randomInt64(secureRandom) }
}
