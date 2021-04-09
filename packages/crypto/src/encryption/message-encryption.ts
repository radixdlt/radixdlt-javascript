import { PrivateKey, PublicKey } from '../_types'
import { SecureRandom, secureRandomGenerator } from '@radixdlt/util'
import {
	AES_GCM,
	aesGCMSealDeterministic,
} from '../symmetric-encryption/aes/aesGCM'
import { Result, ResultAsync } from 'neverthrow'
import { EncryptedMessageT, SealedMessageT } from './_types'
import { Scrypt, ScryptParams } from '../key-derivation-functions/scrypt'
import { AES_GCM_SealedBoxT } from '../symmetric-encryption/aes/_types'
import { generateKeyPair } from '../elliptic-curve/keyPair'
import { sha256 } from '../hash/sha'
import { AES_GCM_SealedBox } from '../symmetric-encryption/aes/aesGCMSealedBox'
import { EncryptedMessage } from './encryptedMessage'
import { SealedMessage } from './sealedMessage'
import { EncryptionScheme } from './encryptionScheme'

const cryptOperationModeEncrypt = 'encrypt' as const
type CryptOperationModeEncrypt = typeof cryptOperationModeEncrypt

const cryptOperationModeDecrypt = 'decrypt' as const
type CryptOperationModeDecrypt = typeof cryptOperationModeDecrypt

type CryptOperationMode = CryptOperationModeEncrypt | CryptOperationModeDecrypt

type CryptOperationEncryptInput = Readonly<{
	plaintext: Buffer
}>
type CryptOperationDecryptInput = Readonly<{
	encrypted: Buffer
}>
type CryptOperationInput =
	| CryptOperationEncryptInput
	| CryptOperationDecryptInput

export type CryptOperationKeysOfParties = Readonly<{
	blackPartyPrivateKey: PrivateKey
	whitePartyPublicKey: PublicKey
}>

type CryptOperationKeys = CryptOperationKeysOfParties &
	Readonly<{
		ephemeralPublicKey: PublicKey
	}>

type CryptOperationBase = Readonly<{
	mode: CryptOperationMode
	input: CryptOperationInput
	keys: CryptOperationKeys
}>

type EncryptT = CryptOperationBase &
	Readonly<{
		mode: CryptOperationModeEncrypt
		input: CryptOperationEncryptInput
	}>

type DecryptT = CryptOperationBase &
	Readonly<{
		mode: CryptOperationModeDecrypt
		input: CryptOperationDecryptInput
	}>

type CryptOperationT = EncryptT | DecryptT

type SharedSecretKey = Readonly<{
	sharedSecretPublicKey: PublicKey
}>

type CryptAlgorithmsT = Readonly<{
	diffieHellman: (keys: CryptOperationKeys) => SharedSecretKey
	symmetricKDF: (input: void) => void
}>

const calculateSharedSecret = (keys: CryptOperationKeys): Buffer => {
	const dh = keys.whitePartyPublicKey
		.decodeToPointOnCurve()
		.multiplyWithPrivateKey(keys.blackPartyPrivateKey)

	const ephemeralPoint = keys.ephemeralPublicKey.decodeToPointOnCurve()
	const sharedSecretPoint = dh.add(ephemeralPoint)
	return Buffer.from(sharedSecretPoint.x.toString(16), 'hex')
}

const kdf = (secret: Buffer, nonce: Buffer): ResultAsync<Buffer, Error> => {
	const salt = sha256(nonce)
	return Scrypt.deriveKey({
		password: secret,
		kdf: 'scrypt',
		params: ScryptParams.create({ salt }),
	})
}

const decrypt = (
	input: Readonly<{
		aesSealedBox: AES_GCM_SealedBoxT
		keys: CryptOperationKeys
	}>,
): ResultAsync<Buffer, Error> => {
	const nonce = input.aesSealedBox.nonce
	const ephemeralPublicKey = input.keys.ephemeralPublicKey

	const sharedSecret = calculateSharedSecret(input.keys)

	const additionalAuthenticationData = ephemeralPublicKey.asData({
		compressed: true,
	})

	return kdf(sharedSecret, nonce)
		.map((symmetricKey) => ({
			...input.aesSealedBox,
			symmetricKey,
			additionalAuthenticationData,
		}))
		.andThen(AES_GCM.open)
}

const aesSealedBoxFromSealedMessage = (
	sealedMessage: SealedMessageT,
): Result<AES_GCM_SealedBoxT, Error> =>
	AES_GCM_SealedBox.create({
		authTag: sealedMessage.authTag,
		ciphertext: sealedMessage.ciphertext,
		nonce: sealedMessage.nonce,
	})

const decryptSealedMessageWithKeysOfParties = (
	input: Readonly<{
		sealedMessage: SealedMessageT
		partyKeys: CryptOperationKeysOfParties
	}>,
): ResultAsync<Buffer, Error> => {
	const ephemeralPublicKey = input.sealedMessage.ephemeralPublicKey

	const keys: CryptOperationKeys = {
		...input.partyKeys,
		ephemeralPublicKey,
	}

	return aesSealedBoxFromSealedMessage(input.sealedMessage)
		.map((aesSealedBox: AES_GCM_SealedBoxT) => ({ aesSealedBox, keys }))
		.asyncAndThen(decrypt)
}

const decryptEncryptedMessage = (
	input: Readonly<{
		encryptedMessage: EncryptedMessageT
		partyKeys: CryptOperationKeysOfParties
	}>,
): ResultAsync<Buffer, Error> => {
	const { partyKeys, encryptedMessage } = input
	return EncryptedMessage.supportsSchemeOf(encryptedMessage)
		.map((sealedMessage) => ({
			sealedMessage,
			partyKeys,
		}))
		.asyncAndThen(decryptSealedMessageWithKeysOfParties)
}

const decryptEncryptedMessageBuffer = (
	input: Readonly<{
		encryptedMessageBuffer: Buffer
		partyKeys: CryptOperationKeysOfParties
	}>,
): ResultAsync<Buffer, Error> =>
	EncryptedMessage.fromBuffer(input.encryptedMessageBuffer)
		.map((encryptedMessage: EncryptedMessageT) => ({
			encryptedMessage,
			partyKeys: input.partyKeys,
		}))
		.asyncAndThen(decryptEncryptedMessage)

const encryptDeterministic = (
	input: Readonly<{
		plaintext: Buffer
		nonce: Buffer
		keys: CryptOperationKeys
	}>,
): ResultAsync<EncryptedMessageT, Error> => {
	const { plaintext, nonce } = input

	const ephemeralPublicKey = input.keys.ephemeralPublicKey

	const sharedSecret = calculateSharedSecret(input.keys)

	return kdf(sharedSecret, nonce)
		.andThen((symmetricKey) =>
			aesGCMSealDeterministic({
				nonce,
				plaintext,
				additionalAuthenticationData: ephemeralPublicKey.asData({
					compressed: true,
				}),
				symmetricKey,
			}),
		)
		.andThen((s) => SealedMessage.fromAESSealedBox(s, ephemeralPublicKey))
		.map(
			(sealedMessage: SealedMessageT): EncryptedMessageT => {
				return EncryptedMessage.create({
					sealedMessage,
					encryptionScheme: EncryptionScheme.current,
				})
			},
		)
}

const encrypt = (
	input: Readonly<{
		plaintext: Buffer | string
		partyKeys: CryptOperationKeysOfParties
		secureRandom?: SecureRandom
	}>,
): ResultAsync<EncryptedMessageT, Error> => {
	const secureRandom = input.secureRandom ?? secureRandomGenerator

	const nonce = Buffer.from(
		secureRandom.randomSecureBytes(AES_GCM.nonceLength),
		'hex',
	)

	const ephemeralKeyPair = generateKeyPair(secureRandom)

	const ephemeralPublicKey = ephemeralKeyPair.publicKey

	const plaintext =
		typeof input.plaintext === 'string'
			? Buffer.from(input.plaintext, 'utf-8')
			: input.plaintext

	return encryptDeterministic({
		plaintext,
		nonce: nonce,
		keys: {
			whitePartyPublicKey: input.partyKeys.whitePartyPublicKey,
			blackPartyPrivateKey: input.partyKeys.blackPartyPrivateKey,
			ephemeralPublicKey,
		},
	})
}

export const MessageEncryption = {
	encrypt,
	decryptEncryptedMessage,
	decryptEncryptedMessageBuffer,
}
