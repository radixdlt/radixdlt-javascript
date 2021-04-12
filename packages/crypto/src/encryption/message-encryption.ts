import { DiffieHellman, ECPointOnCurve, PublicKey } from '../_types'
import { secureRandomGenerator } from '@radixdlt/util'
import {
	AES_GCM,
	aesGCMSealDeterministic,
} from '../symmetric-encryption/aes/aesGCM'
import { combine, okAsync, Result, ResultAsync } from 'neverthrow'
import {
	EncryptedMessageT,
	MessageDecryptionInput,
	MessageEncryptionInput,
	SealedMessageT,
} from './_types'
import { Scrypt, ScryptParams } from '../key-derivation-functions/scrypt'
import { AES_GCM_SealedBoxT } from '../symmetric-encryption/aes/_types'
import { generateKeyPair } from '../elliptic-curve/keyPair'
import { sha256 } from '../hash/sha'
import { AES_GCM_SealedBox } from '../symmetric-encryption/aes/aesGCMSealedBox'
import { EncryptedMessage } from './encryptedMessage'
import { SealedMessage } from './sealedMessage'
import { EncryptionScheme } from './encryptionScheme'

type CalculateSharedSecretInput = Readonly<{
	ephemeralPublicKey: PublicKey
	publicKeyOfOtherParty: PublicKey
	dh: DiffieHellman
}>

const calculateSharedSecret = (
	input: CalculateSharedSecretInput,
): ResultAsync<Buffer, Error> => {
	return input.dh.diffieHellman(input.publicKeyOfOtherParty).map(
		(dhKey: ECPointOnCurve): Buffer => {
			const ephemeralPoint = input.ephemeralPublicKey.decodeToPointOnCurve()
			const sharedSecretPoint = dhKey.add(ephemeralPoint)
			return Buffer.from(sharedSecretPoint.x.toString(16), 'hex')
		},
	)
}

const kdf = (secret: Buffer, nonce: Buffer): ResultAsync<Buffer, Error> => {
	const salt = sha256(nonce)
	return Scrypt.deriveKey({
		password: secret,
		kdf: 'scrypt',
		params: ScryptParams.create({ salt }),
	})
}

const decryptAESSealedBox = (
	input: Readonly<{
		aesSealedBox: AES_GCM_SealedBoxT
		sharedSecret: Buffer
		additionalAuthenticationData: Buffer
	}>,
): ResultAsync<Buffer, Error> => {
	const nonce = input.aesSealedBox.nonce
	const { additionalAuthenticationData } = input

	return kdf(input.sharedSecret, nonce)
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
		publicKeyOfOtherParty: PublicKey
		dh: DiffieHellman
	}>,
): ResultAsync<Buffer, Error> => {
	const ephemeralPublicKey = input.sealedMessage.ephemeralPublicKey

	const additionalAuthenticationData = ephemeralPublicKey.asData({
		compressed: true,
	})

	return combine([
		aesSealedBoxFromSealedMessage(input.sealedMessage).asyncAndThen(
			okAsync,
		),
		calculateSharedSecret({
			...input,
			ephemeralPublicKey,
		}),
	])
		.map((resultList) => {
			const aesSealedBox = resultList[0] as AES_GCM_SealedBoxT
			const sharedSecret = resultList[1] as Buffer
			return {
				aesSealedBox,
				sharedSecret,
				additionalAuthenticationData,
			}
		})
		.andThen(decryptAESSealedBox)
}

const decryptEncryptedMessage = (
	input: Readonly<{
		encryptedMessage: EncryptedMessageT
		publicKeyOfOtherParty: PublicKey
		dh: DiffieHellman
	}>,
): ResultAsync<Buffer, Error> => {
	const { encryptedMessage } = input
	return EncryptedMessage.supportsSchemeOf(encryptedMessage)
		.map((sealedMessage) => ({
			...input,
			sealedMessage,
		}))
		.asyncAndThen(decryptSealedMessageWithKeysOfParties)
}

const decryptEncryptedMessageBuffer = (
	input: Readonly<{
		encryptedMessageBuffer: Buffer
		publicKeyOfOtherParty: PublicKey
		dh: DiffieHellman
	}>,
): ResultAsync<Buffer, Error> =>
	EncryptedMessage.fromBuffer(input.encryptedMessageBuffer)
		.map((encryptedMessage: EncryptedMessageT) => ({
			...input,
			encryptedMessage,
		}))
		.asyncAndThen(decryptEncryptedMessage)

const decrypt = (input: MessageDecryptionInput): ResultAsync<Buffer, Error> =>
	Buffer.isBuffer(input.encryptedMessage)
		? decryptEncryptedMessageBuffer({
				...input,
				encryptedMessageBuffer: input.encryptedMessage,
		  })
		: decryptEncryptedMessage({
				...input,
				encryptedMessage: input.encryptedMessage,
		  })

type DeterministicMessageEncryptionInput = MessageEncryptionInput &
	Readonly<{
		nonce: Buffer
		ephemeralPublicKey: PublicKey
	}>

const __encryptDeterministic = (
	input: DeterministicMessageEncryptionInput,
): ResultAsync<EncryptedMessageT, Error> => {
	const { nonce, ephemeralPublicKey } = input

	const additionalAuthenticationData = ephemeralPublicKey.asData({
		compressed: true,
	})

	const plaintext =
		typeof input.plaintext === 'string'
			? Buffer.from(input.plaintext, 'utf-8')
			: input.plaintext

	return calculateSharedSecret({
		...input,
	}).andThen((sharedSecret) => {
		return kdf(sharedSecret, nonce)
			.andThen((symmetricKey) =>
				aesGCMSealDeterministic({
					nonce,
					plaintext,
					additionalAuthenticationData,
					symmetricKey,
				}),
			)
			.andThen((s) =>
				SealedMessage.fromAESSealedBox(s, ephemeralPublicKey),
			)
			.map(
				(sealedMessage: SealedMessageT): EncryptedMessageT => {
					return EncryptedMessage.create({
						sealedMessage,
						encryptionScheme: EncryptionScheme.current,
					})
				},
			)
	})
}

const encrypt = (
	input: MessageEncryptionInput,
): ResultAsync<EncryptedMessageT, Error> => {
	const secureRandom = input.secureRandom ?? secureRandomGenerator

	const nonce = Buffer.from(
		secureRandom.randomSecureBytes(AES_GCM.nonceLength),
		'hex',
	)

	const ephemeralKeyPair = generateKeyPair(secureRandom)

	const ephemeralPublicKey = ephemeralKeyPair.publicKey

	return __encryptDeterministic({
		...input,
		nonce,
		ephemeralPublicKey,
	})
}

export const MessageEncryption = {
	__encryptDeterministic,
	encrypt,
	decrypt,
}
