import { Long } from 'long'
import { UInt256 } from '@radixdlt/uint256'
import { Result } from 'neverthrow'
import { DSONCodable } from '@radixdlt/dson'
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

export type Amount = DSONCodable &
	Readonly<{
		// Magnitude expressed in min denomination
		magnitude: UInt256
		isMultipleOf: (other: Amount) => boolean
		toString: (radix?: number) => string
		equals: (other: Amount) => boolean
		greaterThan: (other: Amount) => boolean
		lessThan: (other: Amount) => boolean
		greaterThanOrEquals: (other: Amount) => boolean
		lessThanOrEquals: (other: Amount) => boolean
		adding: (other: Amount) => Result<Amount, Error>
		subtracting: (other: Amount) => Result<Amount, Error>
	}>

export type Granularity = Amount

export const minAmountDenomination = -18
export enum Denomination {
	Exa = 18,
	Tera = 12,
	Mega = 6,
	// This is the standard denomination for all UserActions
	Whole = 0,

	Micro = -6,
	Pico = -12,

	// This is the smallest possible denomination and the one used by all APIs.
	// Amounts SHOULD be converted to this denomination prior to being sent to a node.
	Atto = minAmountDenomination,
}

export type PositiveAmount = /* CBORCodable & */ Amount &
	Readonly<{
		witness: string
	}>
