import { EncryptedMessageT, EncryptionSchemeT, SealedMessageT } from './_types'
import { combine, Result } from 'neverthrow'
import { EncryptionScheme, encryptionSchemeLength } from './encryptionScheme'
import { readBuffer } from '@radixdlt/util'
import { SealedMessage } from './sealedMessage'
import { validateMaxLength } from '../symmetric-encryption/aes/aesGCMSealedBox'

export const maxLengthEncryptedMessage = 255

const validateEncryptedMessageLength: (
	buffer: Buffer,
) => Result<Buffer, Error> = validateMaxLength.bind(
	null,
	maxLengthEncryptedMessage,
	'encryptedMessage',
)

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
