import { cipher as forgeCipher, util as forgeUtil } from 'node-forge'
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
			const aesCipher = forgeCipher.createDecipher(
				'AES-CBC',
				forgeUtil.createBuffer(input.key),
			)
			if (input.sharedInfo.s2) {
				aesCipher.start({
					iv: forgeUtil.createBuffer(input.sharedInfo.s2),
				})
			}
			aesCipher.update(forgeUtil.createBuffer(input_.cipher))
			if (!aesCipher.finish()) {
				throw new Error(`AES failed, error unknown...`)
			}
			return Buffer.from(aesCipher.output.toHex(), 'hex')
		},
	}),
}

export const unsafeAESDecryption: DecryptionScheme = {
	length: 32,
	combineDataIntoCryptInput: simpleDataIntoCryptInputCombiner,
	decryptionFunctionBuilder: unsafeDecryptionFunctionBuilder,
}
