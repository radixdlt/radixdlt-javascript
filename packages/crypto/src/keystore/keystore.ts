import { err, ResultAsync, errAsync, ok, Result } from 'neverthrow'
import { KeystoreT, KeystoreCryptoT, KeystoreCryptoCipherParamsT } from './_types'
import { createHmac } from 'crypto'
import { AES_GCM } from '../symmetric-encryption/aes/aesGCM'
import { AES_GCM_SealedBoxT } from '../symmetric-encryption/aes/_index'
import { ScryptParams } from '../key-derivation-functions/scryptParams'
import { SecureRandom, secureRandomGenerator } from '@radixdlt/util'
import { ScryptParamsT } from '../key-derivation-functions/_types'
import { Scrypt } from '../key-derivation-functions/_index'

const minimumPasswordLength = 8

const validatePassword = (password: string): Result<string, Error> => password.length >= minimumPasswordLength ? ok(password) : err(new Error('Password too short'))


const byEncrypting = (input: Readonly<{
	address: string,
	secret: Buffer
	password: string
	id?: string
	kdf?: string
	kdfParams?: ScryptParamsT,
	secureRandom?: SecureRandom
}>): ResultAsync<KeystoreT, Error> => {
	const secureRandom = input.secureRandom ?? secureRandomGenerator

	const kdf = input.kdf ?? 'scrypt'
	const params = input.kdfParams ?? ScryptParams.create({ secureRandom })
	const id = input.id ?? 'uuid'

	return validatePassword(input.password)
		.map((p) => ({ kdf, params, password: Buffer.from(p) }))
		.asyncAndThen((inp) => Scrypt.deriveKey(inp))
		.map((derivedKey) => ({ plaintext: input.secret, symmetricKey: derivedKey, nonce: Buffer.from(params.salt, 'hex')}))
		.andThen((inp) => AES_GCM.seal(inp))
		.map((sealedBox) => {
			const cipherText = sealedBox.ciphertext
			const mac = sealedBox.authTag
			return {
				address: input.address,
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
				version: 1
			}
		})
}



const decrypt = (input: Readonly<{
	keystore: KeystoreT
	password: string
}>): ResultAsync<Buffer, Error> => {
	const { keystore, password } = input
	const kdf = keystore.crypto.kdf
	const encryptedPrivateKey = Buffer.from(keystore.crypto.ciphertext, 'hex')
	const nonce = Buffer.from(keystore.crypto.cipherparams.nonce, 'hex')
	const params = keystore.crypto.kdfparams

	return validatePassword(password)
	.map((p) => ({ kdf, params, password: Buffer.from(p) }))
	.asyncAndThen((inp) => Scrypt.deriveKey(inp))
	.map((derivedKey) => ({ 
		symmetricKey: derivedKey, 
		nonce: Buffer.from(params.salt, 'hex'),
		authTag: Buffer.from(keystore.crypto.mac, 'hex'),
		ciphertext: encryptedPrivateKey,
	}))
	.andThen((inp) => AES_GCM.open(inp))

}


export const Keystore = {
	decrypt,
	minimumPasswordLength,
	validatePassword,
	byEncrypting,
}