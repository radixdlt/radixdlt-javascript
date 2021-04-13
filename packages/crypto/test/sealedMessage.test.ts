import { SealedMessage } from '../dist/encryption/sealedMessage'
import { publicKeyFromBytes } from '../dist/elliptic-curve/publicKey'
import { buffersEquals } from '@radixdlt/util'

describe('SealedMessage', () => {
	const bufWByteCount = (byteCount: number): Buffer =>
		Buffer.from('de'.repeat(byteCount), 'hex')
	const ephemeralPublicKey = publicKeyFromBytes(
		Buffer.from(
			'0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
			'hex',
		),
	)._unsafeUnwrap()

	const plaintext = 'Hello World'
	const ciphertext = Buffer.from(plaintext, 'utf8')
	const nonce = bufWByteCount(SealedMessage.nonceByteCount)
	const authTag = bufWByteCount(SealedMessage.authTagByteCount)

	const input = {
		ephemeralPublicKey,
		nonce,
		authTag,
		ciphertext,
	}

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
	})
})
