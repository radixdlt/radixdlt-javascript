import { SecureRandom } from '@radixdlt/util'
import { decrypt, ECIESEncryptedMessage, encrypt } from "../src/encryption/ecies";
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
			'abababababababababababababababab210381aaadc8a5e83f4576df823cf22a5b1969cf704a0d5f6f68bd757410c9917aac00000010d755d6497300454edea73e99ff5f24df506c6fdd7e80dda8a36c230f38d716c6b5b17f88aea1abe12103e312e3dd58ec',
		)
	})

	it('can decrypt message', () => {
		const bob = keyPair(privateKeyFromScalar(UInt256.valueOf(1)))._unsafeUnwrap()
		const encryptedMsgBuffer = Buffer.from('51358bd242d0436b738dad123ebf1d8b2103ca9978dbb11cb9764e0bcae41504b4521f0290ac0f33fa659528549d9ce84d230000003096dc6785ea0dec1ac1ae15374e327635115407f9ae268aad8b4b6ebae1afefbc83c5792de6fc3550d3e0383918d182e87876c9c0e3b5ca0c960fd95b4bd18421ead2aaf472012e7cfbfd7b314cbae588', 'hex')
		const decrypted = decrypt({
			buffer: encryptedMsgBuffer,
			privateKey: bob.privateKey
		})._unsafeUnwrap()
		expect(decrypted.toString('utf-8')).toBe('Hello Java Library from Radix Swift Library!')
	})
})
