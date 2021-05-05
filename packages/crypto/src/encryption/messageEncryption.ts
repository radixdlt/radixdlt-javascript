import { ECPointOnCurve, PublicKey } from '../_types'
import { secureRandomGenerator } from '@radixdlt/util'
import { combine, errAsync, okAsync, Result, ResultAsync } from 'neverthrow'
import {
	EncryptedMessageT,
	MessageDecryptionInput,
	MessageEncryptionInput,
	SealedMessageT,
} from './_types'
import { Scrypt, ScryptParams } from '../key-derivation-functions'
import {
	AES_GCM_SealedBoxT,
	AES_GCM_SealedBox,
	AES_GCM,
	aesGCMSealDeterministic,
} from '../symmetric-encryption'
import { generateKeyPair } from '../elliptic-curve'
import { sha256 } from '../hash'
import { EncryptedMessage } from './encryptedMessage'
import { SealedMessage } from './sealedMessage'
import { EncryptionScheme } from './encryptionScheme'

type CalculateSharedSecretInput = Readonly<{
	ephemeralPublicKey: PublicKey
	diffieHellmanPoint: () => ResultAsync<ECPointOnCurve, Error>
}>

const calculateSharedSecret = (
	input: CalculateSharedSecretInput,
): ResultAsync<Buffer, Error> => {
	const { diffieHellmanPoint } = input
	return diffieHellmanPoint().map((dhKey: ECPointOnCurve) => {
		const ephemeralPoint = input.ephemeralPublicKey.decodeToPointOnCurve()
		const sharedSecretPoint = dhKey.add(ephemeralPoint)
		return Buffer.from(sharedSecretPoint.x.toString(16), 'hex')
	})
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
		diffieHellmanPoint: () => ResultAsync<ECPointOnCurve, Error>
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

const decryptMessage = (
	input: Readonly<{
		encryptedMessage: EncryptedMessageT
		diffieHellmanPoint: () => ResultAsync<ECPointOnCurve, Error>
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
		diffieHellmanPoint: () => ResultAsync<ECPointOnCurve, Error>
	}>,
): ResultAsync<Buffer, Error> =>
	EncryptedMessage.fromBuffer(input.encryptedMessageBuffer)
		.map((encryptedMessage: EncryptedMessageT) => ({
			...input,
			encryptedMessage,
		}))
		.asyncAndThen(decryptMessage)

const decrypt = (input: MessageDecryptionInput): ResultAsync<Buffer, Error> =>
	Buffer.isBuffer(input.encryptedMessage)
		? decryptEncryptedMessageBuffer({
				...input,
				encryptedMessageBuffer: input.encryptedMessage,
		  })
		: decryptMessage({
				...input,
				encryptedMessage: input.encryptedMessage,
		  })

type DeterministicMessageEncryptionInput = MessageEncryptionInput &
	Readonly<{
		nonce: Buffer
		ephemeralPublicKey: PublicKey
	}>

const encodePlaintext = (plaintext: Buffer | string): Buffer => {
	return typeof plaintext === 'string'
		? Buffer.from(plaintext, 'utf-8')
		: plaintext
}

const __encryptDeterministic = (
	input: DeterministicMessageEncryptionInput,
): ResultAsync<EncryptedMessageT, Error> => {
	const { nonce, ephemeralPublicKey } = input

	const additionalAuthenticationData = ephemeralPublicKey.asData({
		compressed: true,
	})

	const plaintext = encodePlaintext(input.plaintext)

	if (plaintext.length > EncryptedMessage.maxLengthOfCipherTextOfSealedMsg) {
		const errMsg = `Plaintext is too long, expected max #${EncryptedMessage.maxLengthOfCipherTextOfSealedMsg}, but got: #${plaintext.length}`
		return errAsync(new Error(errMsg))
	}

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
			.andThen((sealedMessage: SealedMessageT) => {
				return EncryptedMessage.create({
					sealedMessage,
					encryptionScheme: EncryptionScheme.current,
				})
			})
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
	encodePlaintext,
	encrypt,
	decrypt,
}
