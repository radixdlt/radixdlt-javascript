import { SealedMessage } from '../dist/encryption/sealedMessage'
import { publicKeyFromBytes } from '../dist/elliptic-curve/publicKey'
import { buffersEquals } from '@radixdlt/util'
import { AES_GCM_SealedBox } from '../dist/symmetric-encryption/aes/aesGCMSealedBox'

describe('SealedMessage', () => {
	const bufWByteCount = (byteCount: number, chars: string): Buffer =>
		Buffer.from(chars.repeat(byteCount), 'hex')

	const pubKeyHex =
		'0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798'
	const ephemeralPublicKey = publicKeyFromBytes(
		Buffer.from(pubKeyHex, 'hex'),
	)._unsafeUnwrap()

	const plaintext = 'Hello World'
	const ciphertext = Buffer.from(plaintext, 'utf8')
	const nonce = bufWByteCount(SealedMessage.nonceByteCount, 'de')
	const authTag = bufWByteCount(SealedMessage.authTagByteCount, 'ab')

	const input = {
		ephemeralPublicKey,
		nonce,
		authTag,
		ciphertext,
	}

	const nonceAuthCipherHex =
		'dedededededededededededeabababababababababababababababab48656c6c6f20576f726c64'
	const combinedHex = pubKeyHex + nonceAuthCipherHex

	it('can be created', () => {
		const msg = SealedMessage.create(input)._unsafeUnwrap()
		expect(msg.ephemeralPublicKey.equals(ephemeralPublicKey)).toBe(true)
		expect(buffersEquals(msg.nonce, nonce)).toBe(true)
		expect(buffersEquals(msg.authTag, authTag)).toBe(true)
		expect(buffersEquals(msg.ciphertext, ciphertext)).toBe(true)

		const combined = Buffer.concat([
			ephemeralPublicKey.asData({ compressed: true }),
			nonce,
			authTag,
			ciphertext,
		])
		expect(buffersEquals(msg.combined(), combined)).toBe(true)
		expect(msg.combined().toString('hex')).toBe(combinedHex)
	})

	it('can be created from buffer', () => {
		const buffer = Buffer.from(combinedHex, 'hex')
		const msg = SealedMessage.fromBuffer(buffer)._unsafeUnwrap()
		expect(buffersEquals(msg.nonce, nonce)).toBe(true)
		expect(buffersEquals(msg.authTag, authTag)).toBe(true)
		expect(buffersEquals(msg.ciphertext, ciphertext)).toBe(true)

		expect(buffersEquals(msg.combined(), buffer)).toBe(true)
	})

	it('can be created from AES SealedBox', () => {
		const aesBuffer = Buffer.from(nonceAuthCipherHex, 'hex')
		const aesSealedBox = AES_GCM_SealedBox.fromCombinedBuffer(
			aesBuffer,
		)._unsafeUnwrap()

		expect(buffersEquals(aesSealedBox.combined(), aesBuffer)).toBe(true)

		const msg = SealedMessage.fromAESSealedBox(
			aesSealedBox,
			ephemeralPublicKey,
		)._unsafeUnwrap()

		expect(msg.combined().toString('hex')).toBe(combinedHex)
	})
})
