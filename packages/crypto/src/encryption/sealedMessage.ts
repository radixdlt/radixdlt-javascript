import { combine, err, Result } from 'neverthrow'
import { readBuffer } from '@radixdlt/util'
import { publicKeyFromBytes } from '../elliptic-curve/publicKey'
import {
	AES_GCM,
	AES_GCM_SealedBoxT,
	validateLength,
	validateMaxLength,
} from '../symmetric-encryption/_index'
import { PublicKey, publicKeyCompressedByteCount } from '../_types'
import { SealedMessageT } from './_types'
import { maxLengthEncryptedMessage } from './encryptedMessage'
import { encryptionSchemeLength } from './encryptionScheme'

const create = (
	input: Readonly<{
		ephemeralPublicKey: PublicKey
		nonce: Buffer
		authTag: Buffer
		ciphertext: Buffer
	}>,
): Result<SealedMessageT, Error> => {
	return combine([
		validateNonce(input.nonce),
		validateTag(input.authTag),
		validateCipherText(input.ciphertext),
	]).map((_) => {
		return {
			...input,
			combined: (): Buffer =>
				Buffer.concat([
					input.ephemeralPublicKey.asData({ compressed: true }),
					input.nonce,
					input.authTag,
					input.ciphertext,
				]),
		}
	})
}

const sealedMessageNonceLength = AES_GCM.nonceLength
const sealedMessageAuthTagLength = AES_GCM.tagLength

export const sealedMessageCipherTextMaxLength =
	maxLengthEncryptedMessage -
	sealedMessageNonceLength -
	sealedMessageAuthTagLength -
	encryptionSchemeLength -
	publicKeyCompressedByteCount

export const sealedMessageMinLegth =
	sealedMessageNonceLength +
	sealedMessageAuthTagLength +
	publicKeyCompressedByteCount

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
	sealedMessageCipherTextMaxLength,
	'Ciphertext',
)

const validateSealedMessageMaxLength: (
	buffer: Buffer,
) => Result<Buffer, Error> = validateMaxLength.bind(
	null,
	maxLengthEncryptedMessage - encryptionSchemeLength,
	'SealedMessageT',
)

const sealedMessageFromBuffer = (
	buffer: Buffer,
): Result<SealedMessageT, Error> => {
	const sealedMessageLength = buffer.length
	const lengthOfCiphertext =
		sealedMessageLength -
		publicKeyCompressedByteCount -
		sealedMessageNonceLength -
		sealedMessageAuthTagLength

	if (lengthOfCiphertext <= 0)
		return err(new Error('Ciphertext cannot be empty'))

	return validateSealedMessageMaxLength(buffer).andThen((buffer) => {
		const readNextBuffer = readBuffer.bind(null, buffer)()

		return combine([
			readNextBuffer(publicKeyCompressedByteCount).andThen(
				publicKeyFromBytes,
			),
			readNextBuffer(sealedMessageNonceLength),
			readNextBuffer(sealedMessageAuthTagLength),
			readNextBuffer(lengthOfCiphertext),
		]).andThen((resultList) => {
			const ephemeralPublicKey = resultList[0] as PublicKey
			const nonce = resultList[1] as Buffer
			const authTag = resultList[2] as Buffer
			const ciphertext = resultList[3] as Buffer

			return create({
				ephemeralPublicKey,
				nonce,
				authTag,
				ciphertext,
			})
		})
	})
}

const sealedMsgFromAESSealedBox = (
	aesSealedBox: AES_GCM_SealedBoxT,
	ephemeralPublicKey: PublicKey,
): Result<SealedMessageT, Error> =>
	create({ ...aesSealedBox, ephemeralPublicKey })

export const SealedMessage = {
	nonceByteCount: sealedMessageNonceLength,
	authTagByteCount: sealedMessageAuthTagLength,
	create,
	fromAESSealedBox: sealedMsgFromAESSealedBox,
	fromBuffer: sealedMessageFromBuffer,
}
