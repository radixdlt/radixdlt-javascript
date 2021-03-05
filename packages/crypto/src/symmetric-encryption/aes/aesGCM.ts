import { createDecipheriv } from 'crypto'
import { DecryptionScheme, Decryptor } from '../_types'
import { SharedInfo } from '../../ecies/_types'
import { simpleDataIntoCryptInputCombiner } from './_index'

const aesGCMDecryptionFunctionBuilder = {
	buildDecryptionFunction: (
		input: Readonly<{
			key: Buffer
			sharedInfo: SharedInfo
		}>,
	): Decryptor => ({
		decrypt: (input_: Readonly<{ cipher: Buffer }>): Buffer => {
            if (!input.sharedInfo.s2 || input.sharedInfo.s2.length !== 12) throw new Error('Incorrect length of nonce/IV, should be 12 bytes')
			const decipher = createDecipheriv(
				'aes-256-gcm',
				input.key,
				input.sharedInfo.s2,
			)
            // decipher.setAAD(input.sharedInfo.s1)
            // decipher.setAuthTag()
			const firstChunk = decipher.update(input_.cipher)
			const secondChunk = decipher.final()
			return Buffer.concat([firstChunk, secondChunk])
		},
	}),
}

export const aesDecryption: DecryptionScheme = {
	length: 32,
	combineDataIntoCryptInput: simpleDataIntoCryptInputCombiner,
	decryptionFunctionBuilder: aesGCMDecryptionFunctionBuilder,
}
