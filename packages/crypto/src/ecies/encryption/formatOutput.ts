import { ECIESEncryptedMessage } from '../_types'

export const formatOutput = (
	input: Readonly<{ encryptedMessage: ECIESEncryptedMessage; iv: Buffer }>,
): Buffer => {
	const iv = input.iv
	const msg = input.encryptedMessage
	const ephemeralPublicKeyCompressed = msg.sharedSecret
	const cipherText = msg.cipherText
	const MAC = msg.tag

	let offset = 0
	const serializedCiphertext = Buffer.alloc(
		iv.length +
			1 +
			ephemeralPublicKeyCompressed.length +
			4 +
			cipherText.length +
			MAC.length,
	)

	// IV
	iv.copy(serializedCiphertext, 0)
	offset += iv.length

	// Ephemeral key
	serializedCiphertext.writeUInt8(ephemeralPublicKeyCompressed.length, offset)
	offset++
	ephemeralPublicKeyCompressed.copy(serializedCiphertext, offset)
	offset += ephemeralPublicKeyCompressed.length

	// Ciphertext
	serializedCiphertext.writeUInt32BE(cipherText.length, offset)
	offset += 4
	cipherText.copy(serializedCiphertext, offset)
	offset += cipherText.length

	// MAC
	MAC.copy(serializedCiphertext, offset)

	return serializedCiphertext
}
