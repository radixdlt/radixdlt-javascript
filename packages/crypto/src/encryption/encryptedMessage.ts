import { EncryptedMessageT, EncryptionSchemeT, SealedMessageT } from './_types'
import { combine, Result } from 'neverthrow'
import { EncryptionScheme, encryptionSchemeLength } from './encryptionScheme'
import { readBuffer } from '@radixdlt/util'
import { SealedMessage, sealedMessageMinLegth } from './sealedMessage'
import {
	validateMaxLength,
	validateMinLength,
} from '../symmetric-encryption/aes/aesGCMSealedBox'

export const maxLengthEncryptedMessage = 255

const validateEncryptedMessageMaxLength: (
	buffer: Buffer,
) => Result<Buffer, Error> = validateMaxLength.bind(
	null,
	maxLengthEncryptedMessage,
	'encryptedMessage max length',
)

const minLengthEncryptedMessage = sealedMessageMinLegth + encryptionSchemeLength

const validateEncryptedMessageMinLength: (
	buffer: Buffer,
) => Result<Buffer, Error> = validateMinLength.bind(
	null,
	minLengthEncryptedMessage,
	'encryptedMessage min length',
)

const validateEncryptedMessageLength = (
	buffer: Buffer,
): Result<Buffer, Error> =>
	combine([
		validateEncryptedMessageMaxLength(buffer),
		validateEncryptedMessageMinLength(buffer),
	]).map((_) => buffer)

const create = (
	input: Readonly<{
		encryptionScheme: EncryptionSchemeT
		sealedMessage: SealedMessageT
	}>,
): EncryptedMessageT => {
	return {
		...input,
		combined: (): Buffer =>
			Buffer.concat([
				input.encryptionScheme.combined(),
				input.sealedMessage.combined(),
			]),
	}
}

const fromBuffer = (buf: Buffer): Result<EncryptedMessageT, Error> => {
	return validateEncryptedMessageLength(buf).andThen(
		(buffer): Result<EncryptedMessageT, Error> => {
			const readNextBuffer = readBuffer.bind(null, buffer)()
			return combine([
				readNextBuffer(encryptionSchemeLength).andThen(
					EncryptionScheme.fromBuffer,
				),
				readNextBuffer(buffer.length - encryptionSchemeLength).andThen(
					SealedMessage.fromBuffer,
				),
			]).map(
				(resultList): EncryptedMessageT => {
					const encryptionScheme = resultList[0] as EncryptionSchemeT
					const sealedMessage = resultList[1] as SealedMessageT
					return EncryptedMessage.create({
						encryptionScheme,
						sealedMessage,
					})
				},
			)
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
	create,
	fromBuffer,
	supportsSchemeOf,
}