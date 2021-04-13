import { EncryptedMessageT, EncryptionSchemeT, SealedMessageT } from './_types'
import { combine, Result } from 'neverthrow'
import { EncryptionScheme, encryptionSchemeLength } from './encryptionScheme'
import { readBuffer } from '@radixdlt/util'
import { SealedMessage } from './sealedMessage'
import { validateMaxLength, validateMinLength } from '../utils'
import { publicKeyCompressedByteCount } from '../_types'

export const maxLengthEncryptedMessage = 255
const minLengthEncryptedMessage =
	SealedMessage.authTagByteCount +
	SealedMessage.nonceByteCount +
	publicKeyCompressedByteCount +
	encryptionSchemeLength
const maxLengthOfCipherTextOfSealedMsg =
	maxLengthEncryptedMessage - minLengthEncryptedMessage

const __validateEncryptedMessageMaxLength: (
	buffer: Buffer,
) => Result<Buffer, Error> = validateMaxLength.bind(
	null,
	maxLengthEncryptedMessage,
	'encryptedMessage',
)

const __validateEncryptedMessageMinLength: (
	buffer: Buffer,
) => Result<Buffer, Error> = validateMinLength.bind(
	null,
	minLengthEncryptedMessage,
	'encryptedMessage',
)

export const __validateEncryptedMessageLength = (
	buffer: Buffer,
): Result<Buffer, Error> =>
	combine([
		__validateEncryptedMessageMaxLength(buffer),
		__validateEncryptedMessageMinLength(buffer),
	]).map((_) => buffer)

const create = (
	input: Readonly<{
		encryptionScheme: EncryptionSchemeT
		sealedMessage: SealedMessageT
	}>,
): Result<EncryptedMessageT, Error> => {
	const concatenatedBuffers = Buffer.concat([
		input.encryptionScheme.combined(),
		input.sealedMessage.combined(),
	])

	return __validateEncryptedMessageLength(concatenatedBuffers).map(
		(combinedBuffer) => {
			return {
				...input,
				combined: (): Buffer => combinedBuffer,
			}
		},
	)
}

const fromBuffer = (buf: Buffer): Result<EncryptedMessageT, Error> => {
	return __validateEncryptedMessageLength(buf).andThen(
		(buffer): Result<EncryptedMessageT, Error> => {
			const readNextBuffer = readBuffer.bind(null, buffer)()
			return combine([
				readNextBuffer(encryptionSchemeLength).andThen(
					EncryptionScheme.fromBuffer,
				),
				readNextBuffer(buffer.length - encryptionSchemeLength).andThen(
					SealedMessage.fromBuffer,
				),
			]).andThen((resultList) => {
				const encryptionScheme = resultList[0] as EncryptionSchemeT
				const sealedMessage = resultList[1] as SealedMessageT
				return EncryptedMessage.create({
					encryptionScheme,
					sealedMessage,
				})
			})
		},
	)
}

const supportsSchemeOf = (
	encryptedMessage: EncryptedMessageT,
): Result<SealedMessageT, Error> =>
	EncryptionScheme.isSupported(encryptedMessage.encryptionScheme).map(
		(_) => encryptedMessage.sealedMessage,
	)

export const EncryptedMessage = {
	maxLength: maxLengthEncryptedMessage,
	maxLengthOfCipherTextOfSealedMsg,
	create,
	fromBuffer,
	supportsSchemeOf,
}
