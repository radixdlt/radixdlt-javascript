import { Int64 } from '@radixdlt/primitives'

export type Int32 = number

export type BIP32 = Readonly<{
	pathComponents: BIP32PathComponent[]
	toString: () => string
}>

export type BIP32PathSimple = Readonly<{
	index: Int64
	isHardened: boolean
}>

export type BIP32PathComponent = BIP32PathSimple & Readonly<{
	toString: () => string

	// Not to be confused with the 'index', this is the position of this path component
	// inside a BIP32 path, e.g. in the path
	level: number

	// E.g. 'purpose', 'coinType' 'account', 'change', 'address_index'
	name?: string
}>
