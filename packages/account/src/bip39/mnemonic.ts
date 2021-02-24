import { err, ok, Result } from 'neverthrow'
import { LanguageT, MnemomicT } from './_types'
import { mnemonicToEntropy, wordlists } from 'bip39'

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

const separator = ' '

export const entropyInBitsFromWordCount = (wordCount: number): number => {
	const checksumBitsPerWord = 3
	return (wordCount / checksumBitsPerWord) * 32
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
		const words = phrase.split(separator)
		const wordCount = words.length
		const entropyInBits = entropyInBitsFromWordCount(wordCount)

		return ok({
			words,
			entropy,
			entropyInBits,
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
	fromPhraseInLanguage,
	fromWordsInLanguage,
	fromEnglishPhrase,
	fromEnglishWords,
}
