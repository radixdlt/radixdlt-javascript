import { bech32, bech32m, Decoded } from 'bech32'
import { log, msgFromError } from '@radixdlt/util'
import { err, ok, Result } from 'neverthrow'
import { Bech32T } from './_types'

export const encbech32 = 'bech32' as const
export const encbech32m = 'bech32m' as const
export const defaultEncoding: Encoding = encbech32
export type Encoding = typeof encbech32 | typeof encbech32m

export type HRP = string
export type Data = Buffer

const __unsafeCreate = (
	input: Readonly<{
		bech32String: string
		hrp: HRP
		data: Data
	}>,
): Bech32T => {
	const toString = (): string => input.bech32String
	const equals = (other: Bech32T): boolean => toString() === other.toString()
	return { hrp: input.hrp, data: input.data, equals, toString }
}

export type Bech32EncodeInput = Readonly<{
	hrp: HRP
	data: Data
	encoding?: Encoding
	maxLength?: number
}>

const encode = (input: Bech32EncodeInput): Result<Bech32T, Error> => {
	const { hrp, data: rawData, maxLength } = input
	const encoding = input.encoding ?? defaultEncoding

	const impl = encoding === encbech32 ? bech32 : bech32m
	const words = impl.toWords(rawData)

	let bech32String: string
	try {
		bech32String = impl.encode(hrp, words, maxLength)
	} catch (e) {
		const errMsg = msgFromError(e)
		log.error(errMsg)
		return err(new Error(errMsg))
	}

	const data = Buffer.from(words)
	return ok(
		__unsafeCreate({
			bech32String: bech32String.toLowerCase(),
			hrp,
			data,
		}),
	)
}

export type Bech32DecodeInput = Readonly<{
	bechString: string
	encoding?: Encoding
	maxLength?: number
}>

const decode = (input: Bech32DecodeInput): Result<Bech32T, Error> => {
	const { bechString, maxLength } = input
	const encoding = input.encoding ?? defaultEncoding

	const impl = encoding === encbech32 ? bech32 : bech32m

	let decoded: Decoded
	try {
		decoded = impl.decode(bechString, maxLength)
	} catch (e) {
		const errMsg = msgFromError(e)
		log.error(errMsg)
		return err(new Error(errMsg))
	}

	return ok(
		__unsafeCreate({
			bech32String: bechString,
			hrp: decoded.prefix,
			data: Buffer.from(decoded.words),
		}),
	)
}

export const Bech32 = {
	decode,
	encode,
}
