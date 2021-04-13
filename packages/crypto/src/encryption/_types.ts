import { Byte, SecureRandom } from '@radixdlt/util'
import { PublicKey, DiffieHellman } from '../_types'

export type MessageEncryptionInput = Readonly<{
	plaintext: Buffer | string
	publicKeyOfOtherParty: PublicKey
	dh: DiffieHellman
	secureRandom?: SecureRandom
}>

export type MessageDecryptionInput = Readonly<{
	encryptedMessage: Buffer | EncryptedMessageT
	publicKeyOfOtherParty: PublicKey
	dh: DiffieHellman
}>

export type EncryptionSchemeT = Readonly<{
	length: Byte
	identifier: Buffer // always 31 bytes, pad if shorter.

	combined: () => Buffer
	equals: (other: EncryptionSchemeT) => boolean
}>

export type SealedMessageT = Readonly<{
	/* The public key of the ephemeral key pair. 33 bytes */
	ephemeralPublicKey: PublicKey

	/* The nonce used to encrypt the data. 12 bytes. AKA "IV". */
	nonce: Buffer

	/* An authentication tag. 16 bytes, e.g. AES GCM tag. */
	authTag: Buffer

	/* The encrypted data. Max 162 bytes. */
	ciphertext: Buffer

	combined: () => Buffer
}>

// Max 255 bytes
export type EncryptedMessageT = Readonly<{
	/* Exact 32 bytes */
	encryptionScheme: EncryptionSchemeT

	/* Encrypted message with metadata containing about how it can be decrypted. Max 223 bytes. */
	sealedMessage: SealedMessageT

	combined: () => Buffer
}>
