import { cipher as forgeCipher, util as forgeUtil } from 'node-forge'
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
			if (input.key.length !== 32) {
				throw new Error(
					'Incorrect AES, expected 256 bit mode (32 byte key)',
				)
			}
			const aesCipher = forgeCipher.createCipher(
				'AES-CBC',
				forgeUtil.createBuffer(input.key),
			)
			if (input.sharedInfo.s2) {
				aesCipher.start({
					iv: forgeUtil.createBuffer(input.sharedInfo.s2),
				})
			}
			aesCipher.update(forgeUtil.createBuffer(input_.dataToEncrypt))
			if (!aesCipher.finish()) {
				throw new Error(`AES failed, error unknown...`)
			}
			return Buffer.from(aesCipher.output.toHex(), 'hex')
		},
	}),
}

export const unsafeAESEncryption: EncryptionScheme = {
	length: 32,
	combineDataIntoCryptInput: simpleDataIntoCryptInputCombiner,
	encryptionFunctionBuilder: unsafeEncryptionFunctionBuilder,
}
