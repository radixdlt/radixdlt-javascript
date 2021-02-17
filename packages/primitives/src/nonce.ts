import { Int64, Nonce } from './_types'
import Long from 'long'
import { SecureRandom, secureRandomGenerator } from '@radixdlt/util'
import {
	DSONEncoding,
	JSONEncoding,
	serializerNotNeeded,
} from '@radixdlt/data-formats'

export const NONCE_JSON_TAG = ':u20:'

export const randomInt64 = (
	secureRandom: SecureRandom = secureRandomGenerator,
): Int64 => {
	const random8Bytes = secureRandom.randomSecureBytes(8)
	const bytesArray = Buffer.from(random8Bytes, 'hex')
	return Long.fromBytes(Array.from(bytesArray))
}

export const nonce = (value: Int64 | number): Nonce => {
	const int64 = Long.isLong(value) ? value : Long.fromNumber(value)

	return {
		...JSONEncoding(serializerNotNeeded)(
			() => `${NONCE_JSON_TAG}${BigInt(int64.toString(10)).toString(10)}`,
		),
		...DSONEncoding(serializerNotNeeded)(() => BigInt(int64.toString(10))),

		value: int64,
		equals: (other: Nonce): boolean => other.value.equals(int64),
	}
}

export const randomNonce = (
	secureRandom: SecureRandom = secureRandomGenerator,
): Nonce => nonce(randomInt64(secureRandom))
