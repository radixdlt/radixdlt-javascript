import { Byte } from '@radixdlt/util'
import { PublicKey } from '../_types'

export type MessageEncryptor = Readonly<{
	encrypt: () => void
}>

export type EncryptionSchemeT = Readonly<{
	length: Byte
	identifier: Buffer // always 31 bytes, pad if shorter.
}>

export type SealedMessage = Readonly<{
	/* The public key of the ephemeral key pair. 33 bytes */
	ephemeralPublicKey: PublicKey

	/* The nonce used to encrypt the data. 12 bytes. AKA "IV". */
	nonce: Buffer

	/* An authentication tag. 16 bytes, e.g. AES GCM tag. */
	authTag: Buffer

	/* The encrypted data. Max 162 bytes. */
	ciphertext: Buffer
}>

// Max 255 bytes
export type EncryptedMessageT = Readonly< ̰̰
	/* Exact 32 bytes */
	encryptionScheme: EncryptionSchemeT

	/* Encrypted message with metadata containing about how it can be decrypted. Max 223 bytes. */
	sealedMessage: SealedMessage

	combined: () => Buffer
}>

export type EncryptedMessageToDecrypt = EncryptedMessageT &
	Readonly<{
		publicKeysOfReaders: PublicKey[]
	}>
