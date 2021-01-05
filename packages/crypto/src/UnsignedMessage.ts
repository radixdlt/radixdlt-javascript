import { Hasher, sha256 } from './Hasher'

export type UnsignedMessage = {
	readonly unhashed: Buffer
	readonly hasher: Hasher
}

/**
 * Prepares a plaintext string for hashing and signing at a later point in time.
 *
 * @param {string} plainText - A plaintext string to be encoded and at a later point (not by this method) hashed by input.hasher and signed.
 * @param {Hasher} [hasher=SHA256] - (optional) A hasher that will be used to hash input.plainText. If none is provided, then SHA256 will be used.
 * @returns {UnsignedMessage} a message to be hashed an signed.
 */
export const unsignedPlainText = (input: {
	readonly plainText: string
	readonly hasher?: Hasher
}): UnsignedMessage => {
	const encoded = Buffer.from(input.plainText, 'utf8')

	return {
		unhashed: encoded,
		hasher: input.hasher ?? sha256,
	}
}