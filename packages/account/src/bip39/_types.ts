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
	seed: Buffer
	masterNode: () => HDNodeT
}>

export enum StrengthT {
	/// Entropy of 128 bits
	WORD_COUNT_12 = 128,
	/// Entropy of 160 bits
	WORD_COUNT_15 = 160,
	/// Entropy of 192 bits
	WORD_COUNT_18 = 192,
	/// Entropy of 224 bits
	WORD_COUNT_21 = 224,
	/// Entropy of 256 bits
	WORD_COUNT_24 = 256,
}

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
	strength: StrengthT
	entropy: Buffer
	words: string[]
	phrase: string
	language: LanguageT
	toString: () => string
}>
