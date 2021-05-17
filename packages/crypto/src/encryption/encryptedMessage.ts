import {
	EncryptedMessageT,
	EncryptionScheme,
	ENCRYPTION_SCHEME_BYTES,
	MessageType,
	MESSAGE_TYPE_BYTES,
	SealedMessageT,
} from './_types'
import { combine, err, ok, Result } from 'neverthrow'
import { readBuffer } from '@radixdlt/util'
import { SealedMessage } from './sealedMessage'
import { validateMaxLength, validateMinLength } from '../utils'
import { PublicKey } from '../elliptic-curve'

export const maxLengthEncryptedMessage = 255

export const minLengthEncryptedMessage =
	SealedMessage.authTagByteCount +
	SealedMessage.nonceByteCount +
	PublicKey.compressedByteCount +
	ENCRYPTION_SCHEME_BYTES +
	MESSAGE_TYPE_BYTES

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
		messageType: MessageType
		encryptionScheme: EncryptionScheme
		sealedMessage: SealedMessageT
	}>,
): Result<EncryptedMessageT, Error> => {
	const concatenatedBuffers = Buffer.concat([
		Buffer.from([input.messageType]),
		Buffer.from([input.encryptionScheme]),
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
				readNextBuffer(MESSAGE_TYPE_BYTES).andThen((buffer) =>
					((type: number): Result<number, Error> =>
						type in MessageType
							? ok(type)
							: err(Error(`Unknown message type: ${type}`)))(
						buffer.readUIntBE(0, 1),
					),
				),
				readNextBuffer(ENCRYPTION_SCHEME_BYTES).andThen((buffer) =>
					((scheme: number): Result<number, Error> =>
						scheme in EncryptionScheme
							? ok(scheme)
							: err(
									Error(
										`Unknown encryption scheme: ${scheme}`,
									),
							  ))(buffer.readUIntBE(0, 1)),
				),
				readNextBuffer(
					buffer.length -
						ENCRYPTION_SCHEME_BYTES -
						MESSAGE_TYPE_BYTES,
				).andThen(SealedMessage.fromBuffer),
			]).andThen((resultList) =>
				EncryptedMessage.create({
					messageType: resultList[0] as MessageType,
					encryptionScheme: resultList[1] as EncryptionScheme,
					sealedMessage: resultList[2] as SealedMessageT,
				}),
			)
		},
	)
}

export const EncryptedMessage = {
	maxLength: maxLengthEncryptedMessage,
	maxLengthOfCipherTextOfSealedMsg,
	create,
	fromBuffer,
}
