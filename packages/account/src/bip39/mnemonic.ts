import { err, Result } from 'neverthrow'
import { MnemomicT } from './_types'
import { mnemonicToEntropy, wordlists } from 'bip39'
import HDNode = require('hdkey')

export enum Language {
	ENGLISH,
}

const fromPhrase = (phrase: string): Result<MnemomicT, Error> => {
	throw new Error('impl me')
	// if (!validateMnemonic(phrase)) return err(new Error('Invalid mnemonic phrase'))
	// try {
	//     const entropy = mnemonicToEntropy(phrase, wordlists)
	// } catch (e) {
	//
	// }
}

const fromWords = (words: string[]): Result<MnemomicT, Error> =>
	fromPhrase(words.join(' '))

export const Mnemomic = {
	fromPhrase,
	fromWords,
}
