import { BIP32, BIP32PathComponent } from '../_types'

export type BIP44 = BIP32 &
	Readonly<{
		purpose: BIP32PathComponent
		coinType: BIP32PathComponent
		account: BIP32PathComponent
		change: BIP32PathComponent
		addressIndex: BIP32PathComponent
	}>

export type BIP44ChangeIndex = 0 | 1
