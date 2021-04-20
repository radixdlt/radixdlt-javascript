import { bech32, bech32m, BechLib, Decoded } from 'bech32'
import { log, msgFromError } from '@radixdlt/util'
import { err, ok, Result } from 'neverthrow'
import { Bech32T } from './_types'

export const encbech32 = 'bech32' as const
export const encbech32m = 'bech32m' as const
export const defaultEncoding: Encoding = encbech32
export type Encoding = typeof encbech32 | typeof encbech32m

export type HRP = string
export type Data = Buffer

const convertDataFromBech32 = (bech32Data: Buffer): Buffer => {
	return Buffer.from(bech32.fromWords(bech32Data))
}

const convertDataToBech32 = (data: Buffer): Buffer => {
	return Buffer.from(bech32.toWords(data))
}

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
	const { hrp, data, maxLength } = input
	const encoding = input.encoding ?? defaultEncoding

	const impl: BechLib = encoding === encbech32 ? bech32 : bech32m

	try {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
		const bech32String: string = impl.encode(hrp, data, maxLength)
		return ok(
			__unsafeCreate({
				bech32String: bech32String.toLowerCase(),
				hrp,
				data,
			}),
		)
	} catch (e) {
		const errMsg = msgFromError(e)
		log.error(errMsg)
		return err(new Error(errMsg))
	}
}

export type Bech32DecodeInput = Readonly<{
	bechString: string
	encoding?: Encoding
	maxLength?: number
}>

const decode = (input: Bech32DecodeInput): Result<Bech32T, Error> => {
	const { bechString, maxLength } = input
	const encoding = input.encoding ?? defaultEncoding

	const impl: BechLib = encoding === encbech32 ? bech32 : bech32m

	try {
		const decoded: Decoded = impl.decode(bechString, maxLength)
		return ok(
			__unsafeCreate({
				bech32String: bechString,
				hrp: decoded.prefix,
				data: Buffer.from(decoded.words),
			}),
		)
	} catch (e) {
		const errMsg = msgFromError(e)
		log.error(errMsg)
		return err(new Error(errMsg))
	}
}

export const Bech32 = {
	convertDataToBech32,
	convertDataFromBech32,
	decode,
	encode,
}
