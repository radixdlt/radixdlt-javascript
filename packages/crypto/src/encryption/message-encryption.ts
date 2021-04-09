import { PrivateKey, PublicKey, publicKeyCompressedByteCount } from '../_types'
import {
	Byte,
	firstByteOfNumber,
	readBuffer,
	SecureRandom,
	secureRandomGenerator,
	ValidationWitness,
} from '@radixdlt/util'
import {
	AES_GCM,
	aesGCMSealDeterministic,
} from '../symmetric-encryption/aes/aesGCM'
import { combine, err, errAsync, ok, Result, ResultAsync } from 'neverthrow'
import { EncryptedMessageT, EncryptionSchemeT, SealedMessage } from './_types'
import { Scrypt, ScryptParams } from '../key-derivation-functions/scrypt'
import { AES_GCM_SealedBoxT } from '../symmetric-encryption/aes/_types'
import { generateKeyPair } from '../elliptic-curve/keyPair'
import { sha256 } from '../hash/sha'
import {
	AES_GCM_SealedBox,
	validateLength,
	validateMaxLength,
	validateMinLength,
} from '../symmetric-encryption/aes/aesGCMSealedBox'
import { publicKeyFromBytes } from '../elliptic-curve/publicKey'

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

const currentEncryptionSchemeIdentifier = 'DH_ADD_EPH_AESGCM256_SCRYPT_000'

const supportedEncryptionSchemes = [currentEncryptionSchemeIdentifier]

const encryptionSchemeIdentifierPadChar = '='

export const encryptionSchemeLength = 32
export const encryptionSchemeLengthSpecifyingByteCount = 1
export const encryptionSchemeIdentifierLength =
	encryptionSchemeLength - encryptionSchemeLengthSpecifyingByteCount

const encryptionSchemeNamed = (name: string): EncryptionSchemeT => {
	const actualLength = name.length
	const lengthAsByte: Byte = firstByteOfNumber(actualLength)
	if (actualLength > encryptionSchemeIdentifierLength) {
		throw new Error(
			'Encryption scheme identifier must be 31 chars or less.',
		)
	}
	// pad if needed
	const padded = name.padEnd(
		encryptionSchemeIdentifierLength,
		encryptionSchemeIdentifierPadChar,
	)
	const identifier = Buffer.from(padded, 'utf-8')

	if (identifier.length !== encryptionSchemeIdentifierLength) {
		throw new Error(
			`Incorrect implementation of padded identifier, should be ${encryptionSchemeIdentifierLength} chars.`,
		)
	}

	return {
		length: lengthAsByte,
		identifier,
	}
}

const validateEncryptionSchemeLength: (
	buffer: Buffer,
) => Result<Buffer, Error> = validateLength.bind(
	null,
	encryptionSchemeLength,
	'encryptionScheme',
)

const validateEncryptionSchemeIdentifierLength: (
	buffer: Buffer,
) => Result<Buffer, Error> = validateMaxLength.bind(
	null,
	encryptionSchemeIdentifierLength,
	'encryptionSchemeIdentifier',
)

const encryptionSchemeFromBuffer = (
	buffer: Buffer,
): Result<EncryptionSchemeT, Error> => {
	return validateEncryptionSchemeLength(buffer)
		.andThen((buffer) => {
			const readNextBuffer = readBuffer.bind(null, buffer)()
			return readNextBuffer(encryptionSchemeLengthSpecifyingByteCount)
				.map((schemeIdLenBuf) => schemeIdLenBuf.readUInt8())
				.andThen((schemeIdLenNum) => readNextBuffer(schemeIdLenNum))
				.andThen(validateEncryptionSchemeIdentifierLength)
		})
		.map(
			(identifier): EncryptionSchemeT => ({
				length: firstByteOfNumber(identifier.length),
				identifier,
			}),
		)
}

const encryptionScheme = encryptionSchemeNamed(
	currentEncryptionSchemeIdentifier,
)

export const maxLengthEncryptedMessage = 255

const sealedMessageNonceLength = AES_GCM.nonceLength
const sealedMessageAuthTagLength = AES_GCM.tagLength

export const sealedMessageCipherTextMaxLength =
	maxLengthEncryptedMessage -
	sealedMessageNonceLength -
	sealedMessageAuthTagLength -
	encryptionSchemeLength -
	publicKeyCompressedByteCount

const validateEncryptedMessageLength: (
	buffer: Buffer,
) => Result<Buffer, Error> = validateMaxLength.bind(
	null,
	maxLengthEncryptedMessage,
	'encryptedMessage',
)

const validateSealedMessageLength: (
	buffer: Buffer,
) => Result<Buffer, Error> = validateMaxLength.bind(
	null,
	sealedMessageCipherTextMaxLength,
	'SealedMessage',
)

const validateTag: (
	buffer: Buffer,
) => Result<Buffer, Error> = validateLength.bind(
	null,
	sealedMessageAuthTagLength,
	'auth tag',
)

const validateNonce: (
	buffer: Buffer,
) => Result<Buffer, Error> = validateLength.bind(
	null,
	sealedMessageNonceLength,
	'nonce',
)

const validateCipherText: (
	buffer: Buffer,
) => Result<Buffer, Error> = validateMaxLength.bind(
	null,
	sealedMessageAuthTagLength,
	'Ciphertext',
)

const sealedMessageFromBuffer = (
	buffer: Buffer,
): Result<SealedMessage, Error> => {
	const sealedMessageLength = buffer.length
	const lengthOfCiphertext =
		sealedMessageLength -
		publicKeyCompressedByteCount -
		sealedMessageNonceLength -
		sealedMessageAuthTagLength

	if (lengthOfCiphertext <= 0)
		return err(new Error('Ciphertext cannot be empty'))

	return validateSealedMessageLength(buffer).andThen((buffer) => {
		const readNextBuffer = readBuffer.bind(null, buffer)()

		return combine([
			readNextBuffer(publicKeyCompressedByteCount).andThen(
				publicKeyFromBytes,
			),
			readNextBuffer(sealedMessageNonceLength),
			readNextBuffer(sealedMessageAuthTagLength),
			readNextBuffer(lengthOfCiphertext),
		]).map(
			(resultList): SealedMessage => {
				const ephemeralPublicKey = resultList[0] as PublicKey
				const nonce = resultList[1] as Buffer
				const authTag = resultList[2] as Buffer
				const ciphertext = resultList[3] as Buffer

				return {
					ephemeralPublicKey,
					nonce,
					authTag,
					ciphertext,
				}
			},
		)
	})
}

const validateSealedMessage = (
	input: SealedMessage,
): Result<SealedMessage, Error> =>
	combine([
		validateNonce(input.nonce),
		validateTag(input.authTag),
		validateCipherText(input.ciphertext),
	]).map((_) => input)

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

const sealedMsgFromAESSealBox = (
	aesSealedBox: AES_GCM_SealedBoxT,
	ephemeralPublicKey: PublicKey,
): Result<SealedMessage, Error> => {
	return validateSealedMessage({ ...aesSealedBox, ephemeralPublicKey })
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
	sealedMessage: SealedMessage,
): Result<AES_GCM_SealedBoxT, Error> =>
	AES_GCM_SealedBox.create({
		authTag: sealedMessage.authTag,
		ciphertext: sealedMessage.ciphertext,
		nonce: sealedMessage.nonce,
	})

const decryptSealedMessageWithKeysOfParties = (
	input: Readonly<{
		sealedMessage: SealedMessage
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

const ensureSchemeIsSupported = (
	encryptedMessage: EncryptedMessageT,
): Result<SealedMessage, Error> => {
	const encryptionSchemeIdentifier = encryptedMessage.encryptionScheme.identifier.toString(
		'utf-8',
	)

	if (!supportedEncryptionSchemes.includes(encryptionSchemeIdentifier)) {
		const supportedString = supportedEncryptionSchemes
			.map(
				(s) =>
					`${s}${
						s === currentEncryptionSchemeIdentifier
							? ' (current)'
							: ''
					}`,
			)
			.join(',\n')
		return err(
			new Error(
				`Unsupported encryption scheme, encrypted message specified scheme='${encryptionSchemeIdentifier}', but the only supported schemes are:\n${supportedString}`,
			),
		)
	}
	return ok(encryptedMessage.sealedMessage)
}

const decryptEncryptedMessage = (
	input: Readonly<{
		encryptedMessage: EncryptedMessageT
		partyKeys: CryptOperationKeysOfParties
	}>,
): ResultAsync<Buffer, Error> => {
	const { partyKeys, encryptedMessage } = input
	return ensureSchemeIsSupported(encryptedMessage)
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
	validateEncryptedMessageLength(input.encryptedMessageBuffer).asyncAndThen(
		(buffer) => {
			const readNextBuffer = readBuffer.bind(null, buffer)()
			return combine([
				readNextBuffer(encryptionSchemeLength).andThen(
					encryptionSchemeFromBuffer,
				),
				readNextBuffer(buffer.length - encryptionSchemeLength).andThen(
					sealedMessageFromBuffer,
				),
			])
				.map(
					(resultList): EncryptedMessageT => {
						const encryptionScheme = resultList[0] as EncryptionSchemeT
						const sealedMessage = resultList[1] as SealedMessage
						return {
							encryptionScheme,
							sealedMessage,
						}
					},
				)
				.map((encryptedMessage) => ({
					encryptedMessage,
					partyKeys: input.partyKeys,
				}))
				.asyncAndThen(decryptEncryptedMessage)
		},
	)

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
		.andThen((s) => sealedMsgFromAESSealBox(s, ephemeralPublicKey))
		.map(
			(sealedMessage: SealedMessage): EncryptedMessageT => {
				return {
					sealedMessage,
					encryptionScheme,
				}
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
