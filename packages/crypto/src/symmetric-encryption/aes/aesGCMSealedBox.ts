import { combine, err, ok, Result } from 'neverthrow'
import { AES_GCM_SealedBoxProps, AES_GCM_SealedBoxT } from './_types'
import { buffersEquals, readBuffer } from '@radixdlt/util'

const tagLength = 16
const nonceLength = 12

const cipherMinLength = 1

export const validateMaxLength = (
	expectedMaxLength: number,
	name: string,
	buffer: Buffer,
): Result<Buffer, Error> =>
	buffer.length > expectedMaxLength
		? err(
				new Error(
					`Incorrect length of ${name}, expected max: #${expectedMaxLength} bytes, but got: #${buffer.length}.`,
				),
		  )
		: ok(buffer)

export const validateMinLength = (
	expectedMinLength: number,
	name: string,
	buffer: Buffer,
): Result<Buffer, Error> =>
	buffer.length < expectedMinLength
		? err(
				new Error(
					`Incorrect length of ${name}, expected min: #${expectedMinLength} bytes, but got: #${buffer.length}.`,
				),
		  )
		: ok(buffer)

export const validateLength = (
	expectedLength: number,
	name: string,
	buffer: Buffer,
): Result<Buffer, Error> =>
	buffer.length !== expectedLength
		? err(
				new Error(
					`Incorrect length of ${name}, expected: #${expectedLength} bytes, but got: #${buffer.length}.`,
				),
		  )
		: ok(buffer)

export const validateNonce: (
	buffer: Buffer,
) => Result<Buffer, Error> = validateLength.bind(
	null,
	nonceLength,
	'nonce (IV)',
)
export const validateTag: (
	buffer: Buffer,
) => Result<Buffer, Error> = validateLength.bind(null, tagLength, 'auth tag')

export const validateCiphertext: (
	buffer: Buffer,
) => Result<Buffer, Error> = validateMinLength.bind(
	null,
	cipherMinLength,
	'ciphertext',
)

/*
 * returns combined buffers: `nonce || tag || cipher`
 * */
const combineSealedBoxProps = (input: AES_GCM_SealedBoxProps): Buffer =>
	Buffer.concat([input.nonce, input.authTag, input.ciphertext])

const create = (
	input: AES_GCM_SealedBoxProps,
): Result<AES_GCM_SealedBoxT, Error> =>
	combine([
		validateNonce(input.nonce),
		validateTag(input.authTag),
		validateCiphertext(input.ciphertext),
	]).map((_) => ({
		...input,
		combined: (): Buffer => combineSealedBoxProps(input),
		equals: (other: AES_GCM_SealedBoxT): boolean => {
			return (
				buffersEquals(other.nonce, input.nonce) &&
				buffersEquals(other.authTag, input.authTag) &&
				buffersEquals(other.ciphertext, input.ciphertext)
			)
		},
	}))

/* Buffer is: `nonce || tag || cipher` */
const aesSealedBoxFromBuffer = (
	buffer: Buffer,
): Result<AES_GCM_SealedBoxT, Error> => {
	const readNextBuffer = readBuffer.bind(null, buffer)()
	return combine([
		readNextBuffer(nonceLength),
		readNextBuffer(tagLength),
		readNextBuffer(buffer.length - nonceLength - tagLength),
	])
		.map((parsed: Buffer[]) => {
			const nonce = parsed[0]
			const authTag = parsed[1]
			const ciphertext = parsed[2]

			return {
				nonce,
				authTag,
				ciphertext,
			}
		})
		.andThen(create)
}

export const AES_GCM_SealedBox = {
	fromCombinedBuffer: aesSealedBoxFromBuffer,
	create,
	nonceLength,
	tagLength,
}
