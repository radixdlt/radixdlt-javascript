import { PublicKey } from '../_types'
import { createHmac } from 'crypto'
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
	macFunction: (input: Readonly<{ data: Buffer; key: Buffer }>): Buffer =>
		createHmac('sha256', input.key).update(input.data).digest(),
}
