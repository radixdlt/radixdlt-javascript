import { Long } from 'long'
import { UInt256 } from '@radixdlt/uint256'
import { Result } from 'neverthrow'
import { DSONCodable, JSONEncodable } from '@radixdlt/data-formats'
import { Byte } from '@radixdlt/util'

export type Int64 = Long

export type Nonce = JSONEncodable &
	DSONCodable &
	Readonly<{
		value: Int64
		equals: (other: Nonce) => boolean
	}>

export type Magic = /* DSONCodable & */ Readonly<{
	byte: Byte
}>

export enum DenominationOutputFormat {
	OMIT,
	SHOW_NAME,
	SHOW_SYMBOL,
	SHOW_EXPONENT_BASE_TEN,
}

export type AmountStringFormatting = Readonly<{
	radix?: number
	useLargestDenomination?: boolean
	denominationOutputFormat?: DenominationOutputFormat
}>

export type AmountT = JSONEncodable &
	DSONCodable &
	Readonly<{
		// Magnitude expressed in min denomination
		magnitude: UInt256
		isMultipleOf: (other: AmountT) => boolean
		toString: (formatting?: AmountStringFormatting) => string
		equals: (other: AmountT) => boolean
		greaterThan: (other: AmountT) => boolean
		lessThan: (other: AmountT) => boolean
		greaterThanOrEquals: (other: AmountT) => boolean
		lessThanOrEquals: (other: AmountT) => boolean
		adding: (other: AmountT) => Result<AmountT, Error>
		subtracting: (other: AmountT) => Result<AmountT, Error>
		multiplied: (by: AmountT) => Result<AmountT, Error>
	}>

export type Granularity = AmountT

export const minAmountDenomination = -18
export enum Denomination {
	Exa = 18,
	Peta = 15,
	Tera = 12,
	Giga = 9,
	Mega = 6,
	Kilo = 3,
	// This is the standard denomination for all UserActions
	Whole = 0,

	Milli = -3,
	Micro = -6,
	Nano = -9,
	Pico = -12,
	Femto = -15,
	// This is the smallest possible denomination and the one used by all APIs.
	// Amounts SHOULD be converted to this denomination prior to being sent to a node.
	Atto = minAmountDenomination,
}
