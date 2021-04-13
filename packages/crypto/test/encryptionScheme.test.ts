import {
	EncryptionScheme,
	encryptionSchemeIdentifierLength,
	encryptionSchemeLength,
} from '../dist/encryption/encryptionScheme'

describe('EncryptionScheme', () => {
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
})
