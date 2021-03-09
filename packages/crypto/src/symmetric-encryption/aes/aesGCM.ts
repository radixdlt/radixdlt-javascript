import { createCipheriv, createDecipheriv } from 'crypto'
import { AES_GCM_SealedBoxT } from './_types'
import { AES_GCM_SealedBox } from './aesGCMSealedBox'
import { SharedInfo } from '../../ecies/_types'
import { simpleDataIntoCryptInputCombiner } from './_index'
import { err, ok, Result, combine } from 'neverthrow'
import { SecureRandom, secureRandomGenerator } from '@radixdlt/util'

const tagLength = 16
const nonceLength = 12

const AES_GMM_256_ALGORITHM = 'aes-256-gcm'

export type AES_GCM_Input = Readonly<{
	plaintext: Buffer
	symmetricKey: Buffer
	additionalAuthenticationData?: Buffer
	nonce?: Buffer
	secureRandom?: SecureRandom
}>

const _validateLength = (
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

const validateNonce: (
	buffer: Buffer,
) => Result<Buffer, Error> = _validateLength.bind(
	null,
	nonceLength,
	'nonce (IV)',
)
const validateTag: (
	buffer: Buffer,
) => Result<Buffer, Error> = _validateLength.bind(null, tagLength, 'auth tag')

const seal = (input: AES_GCM_Input): Result<AES_GCM_SealedBoxT, Error> => {
	const secureRandom = input.secureRandom ?? secureRandomGenerator
	const nonce =
		input.nonce ??
		Buffer.from(secureRandom.randomSecureBytes(nonceLength), 'hex')

	return validateNonce(nonce).map((nonce) => {
		const cipher = createCipheriv(
			AES_GMM_256_ALGORITHM,
			input.symmetricKey,
			nonce,
		)
		if (input.additionalAuthenticationData) {
			cipher.setAAD(input.additionalAuthenticationData)
		}
		const firstChunk = cipher.update(input.plaintext)
		const secondChunk = cipher.final()
		const ciphertext = Buffer.concat([firstChunk, secondChunk])
		const authTag = cipher.getAuthTag()

		return AES_GCM_SealedBox.create({
			ciphertext,
			authTag,
			nonce,
		})
	})
}

const open = (
	input: AES_GCM_SealedBoxT &
		Readonly<{
			symmetricKey: Buffer
			additionalAuthenticationData?: Buffer
		}>,
): Result<Buffer, Error> => {
	const {
		ciphertext,
		nonce,
		authTag,
		additionalAuthenticationData,
		symmetricKey,
	} = input

	return combine([validateNonce(nonce), validateTag(authTag)]).map(
		(resultList) => {
			const nonce = resultList[0]
			const authTag = resultList[1]

			const decipher = createDecipheriv(
				AES_GMM_256_ALGORITHM,
				symmetricKey,
				nonce,
			)

			decipher.setAuthTag(authTag)

			if (additionalAuthenticationData) {
				decipher.setAAD(additionalAuthenticationData)
			}

			const firstChunk = decipher.update(ciphertext)
			const secondChunk = decipher.final()
			return Buffer.concat([firstChunk, secondChunk])
		},
	)
}

export const AES_GCM = {
	seal,
	open,
	tagLength,
	nonceLength,
	algorithm: AES_GMM_256_ALGORITHM,
}
