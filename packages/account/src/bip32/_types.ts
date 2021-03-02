import { Int64 } from '@radixdlt/primitives'

export type Int32 = number

export type BIP32T = Readonly<{
	pathComponents: BIP32PathComponentT[]
	toString: () => string
}>

export type BIP32PathSimpleT = Readonly<{
	index: Int64
	isHardened: boolean
}>

export type BIP32PathComponentT = BIP32PathSimpleT &
	Readonly<{
		toString: () => string

		// Not to be confused with the 'index', this is the position of this path component
		// inside a BIP32 path, e.g. `5/3/1` the component '5' has level 0 and '1' has level 2.
		level: number

		// E.g. 'purpose', 'coinType' 'account', 'change', 'address_index'
		name?: string
	}>
