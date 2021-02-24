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

export const strengthFromWordCount = (wordCount: number): StrengthT => {
	if (wordCount === 24) return StrengthT.WORD_COUNT_24
	if (wordCount === 21) return StrengthT.WORD_COUNT_21
	if (wordCount === 18) return StrengthT.WORD_COUNT_18
	if (wordCount === 15) return StrengthT.WORD_COUNT_15
	if (wordCount === 12) return StrengthT.WORD_COUNT_12
	throw new Error(`Unsupported wordcount ${wordCount}`)
}

export const entropyInBitsFromWordCount = (wordCount: number): number => {
	const checksumBitsPerWord = 3
	return (wordCount / checksumBitsPerWord) * 32
}

export const byteCountFromEntropyStrength = (strenght: StrengthT): number => {
	return strenght.valueOf() / 8
}

const generateNew = (
	input: Readonly<{
		strength?: StrengthT // defaults to 24 words (256 bits)
		language?: LanguageT // defaults to English
		secureRandom?: SecureRandom // defaults to default
	}>,
): MnemomicT => {
	const strength = input.strength ?? StrengthT.WORD_COUNT_24
	const language = input.language ?? LanguageT.ENGLISH
	const secureRandom = input.secureRandom ?? secureRandomGenerator
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
	try {
		const entropy = Buffer.from(mnemonicToEntropy(phrase, wordlist), 'hex')
		const words = phrase.normalize('NFKD').split(separator)
		const strength = strengthFromWordCount(words.length)
		return ok({
			words,
			entropy,
			strength,
			phrase,
			language: input.language,
			toString: () => phrase,
		})
	} catch (e) {
		return err(e)
	}
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

export const Mnemomic = {
	generateNew,
	fromPhraseInLanguage,
	fromWordsInLanguage,
	fromEnglishPhrase,
	fromEnglishWords,
}
