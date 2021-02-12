import { Long } from 'long'
import { UInt256 } from '@radixdlt/uint256'
import { Result } from 'neverthrow'
import { DSONCodable } from '@radixdlt/data-formats'
import { Byte } from '@radixdlt/util'

export type Int64 = Long

export type Nonce = DSONCodable &
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
}

export type AmountStringFormatting = Readonly<{
	radix?: number
	useLargestDenomination?: boolean
	denominationOutputFormat?: DenominationOutputFormat
}>

export type Amount = DSONCodable &
	Readonly<{
		// Magnitude expressed in min denomination
		magnitude: UInt256
		isMultipleOf: (other: Amount) => boolean
		toString: (formatting?: AmountStringFormatting) => string
		equals: (other: Amount) => boolean
		greaterThan: (other: Amount) => boolean
		lessThan: (other: Amount) => boolean
		greaterThanOrEquals: (other: Amount) => boolean
		lessThanOrEquals: (other: Amount) => boolean
		adding: (other: Amount) => Result<Amount, Error>
		subtracting: (other: Amount) => Result<Amount, Error>
		multiplied: (by: Amount) => Result<Amount, Error>
	}>

export type Granularity = Amount

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
