import { err, ResultAsync, ok, Result } from 'neverthrow'
import { KeystoreCryptoT, KeystoreT } from './_types'
import { AES_GCM } from '../symmetric-encryption/aes/aesGCM'
import { SecureRandom, secureRandomGenerator } from '@radixdlt/util'
import { ScryptParamsT } from '../key-derivation-functions/_types'
import { Scrypt, ScryptParams } from '../key-derivation-functions/scrypt'
import { v4 as uuidv4 } from 'uuid'
import { AES_GCM_SealedBox } from '../symmetric-encryption/aes/aesGCMSealedBox'
import {
	AES_GCM_OPEN_Input,
	AES_GCM_SealedBoxT,
} from '../symmetric-encryption/aes/_types'

const validatePassword = (password: string): Result<string, Error> =>
	ok(password) // no validation for now...

const encryptSecret = (
	input: Readonly<{
		secret: Buffer
		password: string
		memo?: string
		id?: string
		kdf?: string
		kdfParams?: ScryptParamsT
		secureRandom?: SecureRandom
	}>,
): ResultAsync<KeystoreT, Error> => {
	const secureRandom = input.secureRandom ?? secureRandomGenerator

	const kdf = input.kdf ?? 'scrypt'
	const params = input.kdfParams ?? ScryptParams.create({ secureRandom })
	const id = input.id ?? uuidv4()

	return validatePassword(input.password)
		.map((p) => ({ kdf, params, password: Buffer.from(p) }))
		.asyncAndThen((inp) => Scrypt.deriveKey(inp))
		.map((derivedKey) => ({
			plaintext: input.secret,
			symmetricKey: derivedKey,
			additionalAuthenticationData: input.memo
				? Buffer.from(input.memo)
				: undefined,
		}))
		.andThen((inp) => AES_GCM.seal(inp))
		.map((sealedBox) => {
			const cipherText = sealedBox.ciphertext
			const mac = sealedBox.authTag
			if (sealedBox.nonce.toString('hex') === params.salt) {
				throw new Error(
					'incorrect impl, salt and nonce should not equal',
				)
			}
			return {
				memo: input.memo,
				crypto: {
					cipher: AES_GCM.algorithm,
					cipherparams: {
						nonce: sealedBox.nonce.toString('hex'),
					},
					ciphertext: cipherText.toString('hex'),
					kdf,
					kdfparams: params,
					mac: mac.toString('hex'),
				},
				id,
				version: 1,
			}
		})
}

const decrypt = (
	input: Readonly<{
		keystore: KeystoreT
		password: string
	}>,
): ResultAsync<Buffer, Error> => {
	const { keystore, password } = input
	const kdf = keystore.crypto.kdf
	const encryptedPrivateKey = Buffer.from(keystore.crypto.ciphertext, 'hex')
	const params = keystore.crypto.kdfparams

	return AES_GCM_SealedBox.create({
		nonce: Buffer.from(keystore.crypto.cipherparams.nonce, 'hex'),
		authTag: Buffer.from(keystore.crypto.mac, 'hex'),
		ciphertext: encryptedPrivateKey,
	}).asyncAndThen((aesSealBox: AES_GCM_SealedBoxT) => {
		const additionalAuthenticationData: Buffer | undefined = keystore.memo
			? Buffer.from(keystore.memo)
			: undefined

		const aesOpenInput: Omit<AES_GCM_OPEN_Input, 'symmetricKey'> = {
			...aesSealBox,
			additionalAuthenticationData,
		}

		return validatePassword(password)
			.map((p: string) => ({ kdf, params, password: Buffer.from(p) }))
			.asyncAndThen((inp) => Scrypt.deriveKey(inp))
			.map(
				(derivedKey: Buffer): AES_GCM_OPEN_Input => ({
					...aesOpenInput,
					symmetricKey: derivedKey,
				}),
			)
			.andThen((inp) => AES_GCM.open(inp))
	})
}

const fromBuffer = (keystoreBuffer: Buffer): Result<KeystoreT, Error> => {
	try {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
		const keystore = JSON.parse(keystoreBuffer.toString())
		if (isKeystore(keystore)) return ok(keystore)
		return err(new Error('Parse object, but is not a keystore'))
	} catch {
		return err(new Error('Failed to parse keystore from JSON data'))
	}
}

const isScryptParams = (something: unknown): something is ScryptParamsT => {
	const inspection = something as ScryptParamsT
	return (
		inspection.blockSize !== undefined &&
		inspection.costParameterC !== undefined &&
		inspection.costParameterN !== undefined &&
		inspection.lengthOfDerivedKey !== undefined &&
		inspection.parallelizationParameter !== undefined &&
		inspection.salt !== undefined
	)
}

const isKeystoreCrypto = (something: unknown): something is KeystoreCryptoT => {
	const inspection = something as KeystoreCryptoT
	return (
		inspection.cipher !== undefined &&
		inspection.cipherparams !== undefined &&
		inspection.ciphertext !== undefined &&
		inspection.kdf !== undefined &&
		inspection.kdfparams !== undefined &&
		isScryptParams(inspection.kdfparams)
	)
}

const isKeystore = (something: unknown): something is KeystoreT => {
	const inspection = something as KeystoreT
	return (
		inspection.crypto !== undefined &&
		isKeystoreCrypto(inspection.crypto) &&
		inspection.id !== undefined &&
		inspection.version !== undefined
	)
}

export const Keystore = {
	fromBuffer,
	decrypt,
	validatePassword,
	encryptSecret,
}
