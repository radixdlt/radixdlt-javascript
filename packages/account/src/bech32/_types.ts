import { Data, HRP } from './bech32'

export type Bech32T = Readonly<{
	hrp: HRP

	// excluding checksum
	data: Data

	// including checksum
	toString: () => string

	equals: (other: Bech32T) => boolean
}>
