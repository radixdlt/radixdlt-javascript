import {
	__validateEncryptionSchemeIdentifierLength,
	__validateEncryptionSchemeLength,
	EncryptionScheme,
	encryptionSchemeIdentifierLength,
	encryptionSchemeLength,
} from '../src/encryption/encryptionScheme'
import { buffersEquals } from '@radixdlt/util'

describe('EncryptionScheme', () => {
	describe('scheme buffer length validation functions', () => {
		const makeBuf = (byteCount: number): Buffer =>
			Buffer.from('6a'.repeat(byteCount), 'hex')

		describe('validateEncryptionSchemeLength', () => {
			it('correct scheme length is valid', (done) => {
				const buffer = makeBuf(32)
				__validateEncryptionSchemeLength(buffer).match(
					(buf) => {
						expect(buffersEquals(buf, buffer)).toBe(true)
						done()
					},
					(error) => {
						done(
							new Error(
								`Got error, but expected success: ${error}`,
							),
						)
					},
				)
			})

			const expectedErrorMessage = (actual: number): string =>
				`Incorrect length of encryptionScheme, expected: #32 bytes, but got: #${actual}.`

			it('too short scheme length is invalid', (done) => {
				const shortLength = 31
				const buffer = makeBuf(shortLength)
				__validateEncryptionSchemeLength(buffer).match(
					(_) => {
						done(
							new Error(
								'Buffer passed validation, but we expected a failure.',
							),
						)
					},
					(error) => {
						expect(error.message).toBe(
							expectedErrorMessage(shortLength),
						)
						done()
					},
				)
			})

			it('too long scheme length is invalid', (done) => {
				const longLength = 33
				const buffer = makeBuf(longLength)
				__validateEncryptionSchemeLength(buffer).match(
					(_) => {
						done(
							new Error(
								'Buffer passed validation, but we expected a failure.',
							),
						)
					},
					(error) => {
						expect(error.message).toBe(
							expectedErrorMessage(longLength),
						)
						done()
					},
				)
			})
		})

		describe('validateEncryptionSchemeIdentifierLength', () => {
			it('correct scheme identifier length is valid', (done) => {
				const buffer = makeBuf(31)
				__validateEncryptionSchemeIdentifierLength(buffer).match(
					(buf) => {
						expect(buffersEquals(buf, buffer)).toBe(true)
						done()
					},
					(error) => {
						done(
							new Error(
								`Got error, but expected success: ${error}`,
							),
						)
					},
				)
			})

			const expectedErrorMessageTooLong = (actual: number): string =>
				`Incorrect length of encryptionSchemeIdentifier, expected max: #31 bytes, but got: #${actual}.`

			const expectedErrorMessageTooShort = (actual: number): string =>
				`Incorrect length of encryptionSchemeIdentifier, expected min: #1 bytes, but got: #${actual}.`

			it('too short scheme identifier length is invalid', (done) => {
				const shortLength = 0
				const buffer = makeBuf(shortLength)
				__validateEncryptionSchemeIdentifierLength(buffer).match(
					(_) => {
						done(
							new Error(
								'Buffer passed validation, but we expected a failure.',
							),
						)
					},
					(error) => {
						expect(error.message).toBe(
							expectedErrorMessageTooShort(shortLength),
						)
						done()
					},
				)
			})

			it('too long scheme identifier length is invalid', (done) => {
				const longLength = 32
				const buffer = makeBuf(longLength)
				__validateEncryptionSchemeIdentifierLength(buffer).match(
					(_) => {
						done(
							new Error(
								'Buffer passed validation, but we expected a failure.',
							),
						)
					},
					(error) => {
						expect(error.message).toBe(
							expectedErrorMessageTooLong(longLength),
						)
						done()
					},
				)
			})
		})
	})

	it('length of identifier is 31', () => {
		expect(encryptionSchemeIdentifierLength).toBe(31)
	})

	it('length is 32', () => {
		expect(encryptionSchemeLength).toBe(32)
	})

	it('has an expected default value', () => {
		const scheme = EncryptionScheme.current
		const expectedID = 'DH_ADD_EPH_AESGCM256_SCRYPT_000'
		expect(scheme.identifier.toString('utf8')).toBe(expectedID)
		expect(scheme.length).toBe(expectedID.length)

		expect(scheme.identifier.length).toBe(encryptionSchemeIdentifierLength)
		expect(scheme.combined().toString('hex')).toBe(
			'1f44485f4144445f4550485f41455347434d3235365f5343525950545f303030',
		)
	})

	it('can be created from buffer', () => {
		const buffer = Buffer.from(
			'1f44485f4144445f4550485f41455347434d3235365f5343525950545f303030',
			'hex',
		)
		const scheme = EncryptionScheme.fromBuffer(buffer)._unsafeUnwrap()
		expect(scheme.identifier.toString('utf8')).toBe(
			'DH_ADD_EPH_AESGCM256_SCRYPT_000',
		)
	})

	it('is padded if shorter than 31 chars', () => {
		const identifierString = 'HELLO'
		const scheme = EncryptionScheme.fromName(
			identifierString,
		)._unsafeUnwrap()
		expect(scheme.identifier.toString('utf8')).toBe(
			identifierString +
				'='.repeat(
					encryptionSchemeIdentifierLength - identifierString.length,
				),
		)
		expect(scheme.identifier.length).toBe(encryptionSchemeIdentifierLength)
		expect(scheme.length).toBe(identifierString.length)
	})

	it('cannot be longer than 31 chars', () => {
		EncryptionScheme.fromName('a'.repeat(32)).match(
			(_) => {
				throw new Error('expected fail')
			},
			(e) => {
				expect(e.message).toBe(
					'Encryption scheme identifier must be 31 chars or less.',
				)
			},
		)
	})

	it('current scheme is supported', () => {
		EncryptionScheme.isSupported(EncryptionScheme.current).match(
			(w) => {
				expect(w.witness).toBe('supported')
			},
			(e) => {
				throw new Error(
					`Got error, but expected current scheme to always be supported. Error: ${e}`,
				)
			},
		)
	})

	it('unknown scheme is not supported', () => {
		const unknown = EncryptionScheme.fromName('UNKNOWN')._unsafeUnwrap()
		EncryptionScheme.isSupported(unknown).match(
			(w) => {
				throw new Error(
					'Unknown scheme is believed to be supported, which it should not be!',
				)
			},
			(e) => {
				expect(e.message)
					.toBe(`Unsupported encryption scheme, encrypted message specified scheme='UNKNOWN========================', but the only supported schemes are:
DH_ADD_EPH_AESGCM256_SCRYPT_000 (current)`)
			},
		)
	})

	it('only current scheme DH_ADD_EPH_AESGCM256_SCRYPT_000 is supported', () => {
		expect(EncryptionScheme.supportedSchemes).toStrictEqual([
			'DH_ADD_EPH_AESGCM256_SCRYPT_000',
		])
	})
})
