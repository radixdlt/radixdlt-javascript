import { PublicKey } from '../_types'
import { SharedInfo } from '../ecies/_types'

export type MessageAuthenticationCodeScheme = Readonly<{
	// `mackeylen`
	length: number
	/// Build input
	combineDataForMACInput: (
		input: Readonly<{
			sharedInfo: SharedInfo
			cipher: Buffer
			ephemeralPublicKey: PublicKey
		}>,
	) => Buffer
	/// `MAC`
	macFunction: (input: Readonly<{ data: Buffer; key: Buffer }>) => Buffer
}>
