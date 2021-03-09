import { createCipheriv, createDecipheriv } from 'crypto'
import { DecryptionScheme, Decryptor } from '../_types'
import { SharedInfo } from '../../ecies/_types'
import { simpleDataIntoCryptInputCombiner } from './_index'
import { combine, err, ok, Result, combine } from 'neverthrow'
import { SecureRandom, secureRandomGenerator } from '@radixdlt/util'

const tagLength = 16
const nonceLength = 12

const AES_GMM_256_ALGORITHM = 'aes-256-gcm'

export type AES_GCM_Input = Readonly<{
	symmetricKey: Buffer
	nonce: Buffer
	authenticationTag: Buffer
	additionalAuthenticationData?: Buffer
}>

export type SealedBoxT = Omit<AES_GCM_Input, 'additionalAuthenticationData'> &
	Readonly<{
		ephemeralPublicKey: Buffer
	}>

const _validateLength = (
	input: Readonly<{
		expectedLength: number
		name: string
		buffer: Buffer
	}>,
): Result<Buffer, Error> =>
	input.buffer.length !== input.expectedLength
		? err(
				new Error(
					`Incorrect length of ${input.name}, expected: #${input.expectedLength} bytes, but got: #${input.buffer.length}.`,
				),
		  )
		: ok(input.buffer)

const validateNonce: (buffer: Buffer) => Result<Buffer, Error> = _validateLength.bind(null, nonceLength, 'nonce (IV)')
const validateTag: (buffer: Buffer) => Result<Buffer, Error> = _validateLength.bind(null, tagLength, 'auth tag')

const seal = (
	input: Omit<AES_GCM_Input, 'nonce'> & {
		plaintext: Buffer
		secureRandom?: SecureRandom
		nonce?: Buffer
	},
): Result<SealedBoxT, Error> => {
	const secureRandom = input.secureRandom ?? secureRandomGenerator
	const nonce = input.nonce ?? Buffer.from(secureRandom.randomSecureBytes(nonceLength), 'hex')

	return validateNonce(nonce).map((nonce) => {
		const cipher = createCipheriv(AES_GMM_256_ALGORITHM, input.symmetricKey, nonce)
		if (input.additionalAuthenticationData) {
			cipher.setAAD(input.additionalAuthenticationData)	
		}
		const firstChunk = cipher.update(input.plaintext)
		const secondChunk = cipher.final()
		const ciphertext = Buffer.concat([firstChunk, secondChunk])
		const authTag = cipher.getAuthTag()

		return {
			
		}
	})
}

const open = (
	input: Readonly<{
		ciphertext: Buffer
		input: AES_GCM_Input
	}>,
): Result<Buffer, Error> => {
	const sealedbox = input.input
	const ciphertext = input.ciphertext

	return combine([
		validateNonce(sealedbox.nonce),
		validateTag(sealedbox.authenticationTag),
	]).map((resultList) => {
		const nonce = resultList[0]
		const authTag = resultList[1]

		const decipher = createDecipheriv(
			AES_GMM_256_ALGORITHM,
			sealedbox.symmetricKey,
			nonce,
		)

		decipher.setAuthTag(authTag)

		if (sealedbox.additionalAuthenticationData) {
			decipher.setAAD(sealedbox.additionalAuthenticationData)
		}

		const firstChunk = decipher.update(ciphertext)
		const secondChunk = decipher.final()
		return Buffer.concat([firstChunk, secondChunk])
	})
}

export const AES_GCM = {
	seal,
	open,
	tagLength,
	nonceLength,
}
