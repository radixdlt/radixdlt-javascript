import { createDecipheriv } from 'crypto'
import { DecryptionScheme, Decryptor } from '../_types'
import { SharedInfo } from '../../ecies/_types'
import { simpleDataIntoCryptInputCombiner } from './_index'

const unsafeDecryptionFunctionBuilder = {
	buildDecryptionFunction: (
		input: Readonly<{
			key: Buffer
			sharedInfo: SharedInfo
		}>,
	): Decryptor => ({
		decrypt: (input_: Readonly<{ cipher: Buffer }>): Buffer => {
			const decipher = createDecipheriv(
				'aes-256-cbc',
				input.key,
				input.sharedInfo.s2 ?? null,
			)
			const firstChunk = decipher.update(input_.cipher)
			const secondChunk = decipher.final()
			return Buffer.concat([firstChunk, secondChunk])
		},
	}),
}

export const unsafeAESDecryption: DecryptionScheme = {
	length: 32,
	combineDataIntoCryptInput: simpleDataIntoCryptInputCombiner,
	decryptionFunctionBuilder: unsafeDecryptionFunctionBuilder,
}
