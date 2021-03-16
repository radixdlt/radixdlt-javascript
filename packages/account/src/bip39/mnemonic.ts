import { err, ok, Result } from 'neverthrow'
import { LanguageT, MnemomicT, StrengthT } from './_types'
import {
	entropyToMnemonic,
	mnemonicToEntropy,
	validateMnemonic,
	wordlists,
} from 'bip39'
import { SecureRandom, secureRandomGenerator } from '@radixdlt/util'

export const wordlistFromLanguage = (language: LanguageT): string[] => {
	const key = LanguageT[language].toLowerCase()
	return wordlists[key]
}

export const languagesSupportedByBIP39: LanguageT[] = [
	LanguageT.CZECH,
	LanguageT.CHINESE_SIMPLIFIED,
	LanguageT.CHINESE_TRADITIONAL,
	LanguageT.KOREAN,
	LanguageT.FRENCH,
	LanguageT.ITALIAN,
	LanguageT.SPANISH,
	LanguageT.JAPANESE,
	LanguageT.ENGLISH,
]

export const mnemonicStrengthSupportedByBIP39: StrengthT[] = [
	StrengthT.WORD_COUNT_12,
	StrengthT.WORD_COUNT_15,
	StrengthT.WORD_COUNT_18,
	StrengthT.WORD_COUNT_21,
	StrengthT.WORD_COUNT_24,
]

const separator = ' '

export const strengthFromWordCount = (
	wordCount: number,
): Result<StrengthT, Error> => {
	return wordCount === 24
		? ok(StrengthT.WORD_COUNT_24)
		: wordCount === 21
		? ok(StrengthT.WORD_COUNT_21)
		: wordCount === 18
		? ok(StrengthT.WORD_COUNT_18)
		: wordCount === 15
		? ok(StrengthT.WORD_COUNT_15)
		: wordCount === 12
		? ok(StrengthT.WORD_COUNT_12)
		: err(Error(`Unsupported wordcount ${wordCount}`))
}

export const entropyInBitsFromWordCount = (wordCount: number): number => {
	const checksumBitsPerWord = 3
	return (wordCount / checksumBitsPerWord) * 32
}

export const byteCountFromEntropyStrength = (strenght: StrengthT): number =>
	strenght.valueOf() / 8

const generateNew = (
	input?: Readonly<{
		strength?: StrengthT // defaults to 12 words (128 bits)
		language?: LanguageT // defaults to English
		secureRandom?: SecureRandom // defaults to default
	}>,
): MnemomicT => {
	const strength = input?.strength ?? StrengthT.WORD_COUNT_12
	const language = input?.language ?? LanguageT.ENGLISH
	const secureRandom = input?.secureRandom ?? secureRandomGenerator
	const entropyByteCount = byteCountFromEntropyStrength(strength)
	const entropy = Buffer.from(
		secureRandom.randomSecureBytes(entropyByteCount),
		'hex',
	)
	const wordlist = wordlistFromLanguage(language)
	const phrase = entropyToMnemonic(entropy, wordlist)
	if (!validateMnemonic(phrase, wordlist))
		throw new Error(
			'Incorrect impl, should be able to always generate valid mnemonic',
		)

	const words = phrase.normalize('NFKD').split(separator)

	return {
		words,
		entropy,
		strength,
		phrase,
		language,
		toString: () => phrase,
	}
}

const fromPhraseInLanguage = (
	input: Readonly<{
		phrase: string
		language: LanguageT
	}>,
): Result<MnemomicT, Error> => {
	const wordlist = wordlistFromLanguage(input.language)
	const phrase = input.phrase

	let entropy: Buffer
	try {
		entropy = Buffer.from(mnemonicToEntropy(phrase, wordlist), 'hex')
	} catch (e) {
		return err(e)
	}
	const words = phrase.normalize('NFKD').split(separator)
	return strengthFromWordCount(words.length).map((strength) => ({
		words,
		entropy,
		strength,
		phrase,
		language: input.language,
		toString: () => phrase,
	}))
}

const fromWordsInLanguage = (
	input: Readonly<{
		words: string[]
		language: LanguageT
	}>,
): Result<MnemomicT, Error> =>
	fromPhraseInLanguage({
		phrase: input.words.join(separator),
		language: input.language,
	})

const fromEnglishPhrase = (phrase: string): Result<MnemomicT, Error> =>
	fromPhraseInLanguage({
		phrase,
		language: LanguageT.ENGLISH,
	})

const fromEnglishWords = (words: string[]): Result<MnemomicT, Error> =>
	fromWordsInLanguage({
		words,
		language: LanguageT.ENGLISH,
	})

export const Mnemonic = {
	generateNew,
	fromPhraseInLanguage,
	fromWordsInLanguage,
	fromEnglishPhrase,
	fromEnglishWords,
}
