import { __validateEncryptedMessageLength } from '../src/encryption/encryptedMessage'
import { buffersEquals } from '@radixdlt/util'

describe('EncryptedMessage', () => {
	const makeBuf = (byteCount: number): Buffer =>
		Buffer.from('6a'.repeat(byteCount), 'hex')

	describe('validateEncryptedMessageLength', () => {
		it('correct msg length is valid', (done) => {
			const buffer = makeBuf(100)
			__validateEncryptedMessageLength(buffer).match(
				(buf) => {
					expect(buffersEquals(buf, buffer)).toBe(true)
					done()
				},
				(error) => {
					done(new Error(`Got error, but expected success: ${error}`))
				},
			)
		})

		it('too short msg length is invalid', (done) => {
			const shortLength = 10
			const buffer = makeBuf(shortLength)
			__validateEncryptedMessageLength(buffer).match(
				(_) => {
					done(
						new Error(
							'Buffer passed validation, but we expected a failure.',
						),
					)
				},
				(error) => {
					expect(error.message).toBe(
						`Incorrect length of encryptedMessage, expected min: #93 bytes, but got: #${shortLength}.`,
					)
					done()
				},
			)
		})

		it('too long msg is invalid', (done) => {
			const longLength = 256
			const buffer = makeBuf(longLength)
			__validateEncryptedMessageLength(buffer).match(
				(_) => {
					done(
						new Error(
							'Buffer passed validation, but we expected a failure.',
						),
					)
				},
				(error) => {
					expect(error.message).toBe(
						`Incorrect length of encryptedMessage, expected max: #255 bytes, but got: #${longLength}.`,
					)
					done()
				},
			)
		})
	})
})
