import { combine, err, Result } from 'neverthrow'
import { readBuffer } from '@radixdlt/util'
import { publicKeyFromBytes } from '../elliptic-curve/publicKey'
import { AES_GCM, AES_GCM_SealedBoxT } from '../symmetric-encryption/_index'
import { PublicKey, publicKeyCompressedByteCount } from '../_types'
import { SealedMessageT } from './_types'
import { validateLength } from '../utils'

const create = (
	input: Readonly<{
		ephemeralPublicKey: PublicKey
		nonce: Buffer
		authTag: Buffer
		ciphertext: Buffer
	}>,
): Result<SealedMessageT, Error> => {
	return combine([
		__validateNonce(input.nonce),
		__validateTag(input.authTag),
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

export const __validateTag: (
	buffer: Buffer,
) => Result<Buffer, Error> = validateLength.bind(
	null,
	sealedMessageAuthTagLength,
	'auth tag',
)

export const __validateNonce: (
	buffer: Buffer,
) => Result<Buffer, Error> = validateLength.bind(
	null,
	sealedMessageNonceLength,
	'nonce',
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