import { SecureRandom } from '@radixdlt/util'
import { ECIESEncryptedMessage, encrypt } from '../src/encryption/ecies'
import { PublicKey, KeyPair } from '../src/_types'
import { privateKeyFromScalar } from '../src/privateKey'
import { isUInt256 } from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'
import { keyPair } from '../src/keyPair'
import { generateKeyPair } from '../dist/keyPair'

export const unsafeTestRandom: SecureRandom = {
	randomSecureBytes: (byteCount: number) =>
		Array(byteCount).fill('ab').join(''),
}

const hardcodedUnsafeRandomECIES = (
	message: string,
	peerPublicKey: PublicKey,
): ECIESEncryptedMessage => {
	return encrypt({
		message: Buffer.from(message, 'utf-8'),
		peerPublicKey,
		secureRandom: unsafeTestRandom,
	})._unsafeUnwrap()
}

const makeKeyPair = (scalar: UInt256 | number): KeyPair => {
	const privateKeyScalar = isUInt256(scalar)
		? scalar
		: UInt256.valueOf(scalar)
	const privateKey = privateKeyFromScalar(privateKeyScalar)
	return keyPair(privateKey)._unsafeUnwrap()
}

describe('ECIES', () => {
	// const bob = makeKeyPair(1337)

	it('can encrypt', () => {
		const bob = generateKeyPair(unsafeTestRandom)._unsafeUnwrap()

		// const hardcodedEphemeral = makeKeyPair(42)
		const encryptedMessage = hardcodedUnsafeRandomECIES(
			'Hello Radix',
			bob.publicKey,
		)
		expect(encryptedMessage.toBuffer().toString('hex')).toBe(
			'0381aaadc8a5e83f4576df823cf22a5b1969cf704a0d5f6f68bd757410c9917aac9ff7d75d91bf12edf3f444e3b5be98cd8b70487b4e1ed9effe1dd169ed49534f093f4d9ce834c4b25ac203482822bae7',
		)
	})
})
