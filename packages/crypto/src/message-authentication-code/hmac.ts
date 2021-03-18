import { PublicKey } from '../_types'
import { hmac as forgeHmac, util as forgeUtil } from 'node-forge'
import { MessageAuthenticationCodeScheme } from './_types'
import { SharedInfo } from '../ecies/_types'

export const hmacSHA256: MessageAuthenticationCodeScheme = {
	length: 32,
	combineDataForMACInput: (
		input: Readonly<{
			sharedInfo: SharedInfo
			cipher: Buffer
			ephemeralPublicKey: PublicKey
		}>,
	): Buffer =>
		Buffer.concat([
			input.sharedInfo.s2 ?? Buffer.alloc(0),
			input.ephemeralPublicKey.asData({ compressed: true }),
			input.cipher,
		]),
	macFunction: (input: Readonly<{ data: Buffer; key: Buffer }>): Buffer => {
		const hmac = forgeHmac.create()
		if (input.key.length !== 32) {
			throw new Error(
				'Invalid key length, expected 32 bytes for sha256 hmac',
			)
		}

		hmac.start('sha256', forgeUtil.createBuffer(input.key))
		hmac.update(forgeUtil.hexToBytes(input.data.toString('hex')))

		const digest = hmac.digest()
		const digestHex = digest.toHex()
		return Buffer.from(digestHex, 'hex')
	},
}
