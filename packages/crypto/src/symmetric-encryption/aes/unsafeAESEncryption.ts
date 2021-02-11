import { createCipheriv } from 'crypto'
import { EncryptionScheme, Encryptor } from '../_types'
import { simpleDataIntoCryptInputCombiner } from './_index'
import { SharedInfo } from '../../ecies/_types'

const unsafeEncryptionFunctionBuilder = {
	buildEncryptionFunction: (
		input: Readonly<{
			key: Buffer
			sharedInfo: SharedInfo
		}>,
	): Encryptor => ({
		encrypt: (input_: Readonly<{ dataToEncrypt: Buffer }>): Buffer => {
			const cipher = createCipheriv(
				'aes-256-cbc',
				input.key,
				input.sharedInfo.s2 ?? null,
			)
			const firstChunk = cipher.update(input_.dataToEncrypt)
			const secondChunk = cipher.final()
			return Buffer.concat([firstChunk, secondChunk])
		},
	}),
}

export const unsafeAESEncryption: EncryptionScheme = {
	length: 32,
	combineDataIntoCryptInput: simpleDataIntoCryptInputCombiner,
	encryptionFunctionBuilder: unsafeEncryptionFunctionBuilder,
}
