import { BIP32T, BIP32PathComponentT } from '../_types'

export type BIP44T = BIP32T &
	Readonly<{
		purpose: BIP32PathComponentT
		coinType: BIP32PathComponentT
		account: BIP32PathComponentT
		change: BIP32PathComponentT
		addressIndex: BIP32PathComponentT
	}>

export type BIP44ChangeIndex = 0 | 1
