import { EncryptionScheme } from '../dist/encryption/encryptionScheme'

describe('EncryptionScheme', () => {
	it('has an expected default value', () => {
		const scheme = EncryptionScheme.current
		const expectedID = 'DH_ADD_EPH_AESGCM256_SCRYPT_000'
		expect(scheme.identifier.toString('utf8')).toBe(expectedID)
		expect(scheme.length).toBe(expectedID.length)
	})
})