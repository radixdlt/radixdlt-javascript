import { BIP32T } from '../_index'
import { PublicKey, PrivateKey } from '@radixdlt/crypto'

export type HDNodeT = Readonly<{
	publicKey: PublicKey
	privateKey: PrivateKey
	chainCode: Buffer
	derive: (path: BIP32T) => HDNodeT
	toJSON: () => Readonly<{
		// privateExtendedKey
		xpriv: string
		// publicExtendedKey
		xpub: string
	}>
}>

export type HDMasterSeedT = Readonly<{
	entropy: Buffer
	seed: Buffer
	masterNode: () => HDNodeT
}>

export enum LanguageT {
	CZECH,
	CHINESE_SIMPLIFIED,
	CHINESE_TRADITIONAL,
	KOREAN,
	FRENCH,
	ITALIAN,
	SPANISH,
	JAPANESE,
	PORTUGUESE,
	ENGLISH,
}

export type MnemomicT = Readonly<{
	entropyInBits: number
	entropy: Buffer
	words: string[]
	phrase: string
	language: LanguageT
	toString: () => string
}>
