import {
	AmountT,
	AmountStringFormatting,
	Denomination,
	minAmountDenomination,
} from './_types'
import { UInt256 } from '@radixdlt/uint256'
import { err, ok, Result } from 'neverthrow'
import BN from 'bn.js'
import {
	bnFromUInt256,
	isUnsafeInputForUInt256,
	uint256FromBN,
	uint256FromUnsafe,
	UInt256InputUnsafe,
	uint256Max,
} from './uint256-extensions'
import {
	DSONObjectEncoding,
	JSONDecoding,
	JSONEncoding,
	serializerNotNeeded,
	taggedStringDecoder,
} from '@radixdlt/data-formats'
import { denominations, formatDenomination } from './denomination'
import { Byte } from '@radixdlt/util'

const CBOR_BYTESTRING_PREFIX: Byte = 5
const JSON_TAG = ':u20:'

const JSONDecoder = taggedStringDecoder(JSON_TAG)((data: string) =>
	ok(inSmallestDenomination(new UInt256(data))),
)

const jsonDecoding = JSONDecoding.withDecoders(JSONDecoder).create<AmountT>()

export const min = (lhs: AmountT, rhs: AmountT): AmountT =>
	lhs.lessThanOrEquals(rhs) ? lhs : rhs

const toString = (
	input: AmountStringFormatting &
		Readonly<{
			denomination: Denomination
			magnitude: UInt256
		}>,
): string => {
	const denomination = input.denomination
	const radix = input.radix ?? 10
	const useLargestDenomination = input.useLargestDenomination ?? true

	const magnitudeAndDenomination = useLargestDenomination
		? expressMagnitudeInLargestDenomination({
				magnitude: input.magnitude,
				denomination,
		  })
		: { magnitude: input.magnitude, denomination: input.denomination }

	const magnitude = magnitudeAndDenomination.magnitude
	const magnitudeString = magnitude.toString(radix)
	return [
		magnitudeString,
		formatDenomination({
			outputFormat: input.denominationOutputFormat,
			denomination: magnitudeAndDenomination.denomination,
		}),
	]
		.join(' ')
		.trim()
}

const inSmallestDenomination = (magnitude: UInt256): AmountT => {
	/* eslint-disable max-params */
	const doArithmetic = (
		other: AmountT,
		operation: (a: BN, b: BN) => BN,
	): Result<AmountT, Error> => {
		const selfBN = bnFromUInt256(magnitude)
		const otherBN = bnFromUInt256(other.magnitude)
		const arithmeticResult = operation(selfBN, otherBN)
		return uint256FromBN(arithmeticResult)
			.map((foo) => ({
				magnitude: foo,
				denomination: Denomination.Atto,
			}))
			.andThen(fromUInt256)
	}

	const buffer = bnFromUInt256(magnitude).toArrayLike(Buffer, 'be', 32)

	return {
		...JSONEncoding(serializerNotNeeded)(
			() => `${JSON_TAG}${magnitude.toString(10)}`,
		),
		...DSONObjectEncoding({
			prefix: CBOR_BYTESTRING_PREFIX,
			buffer,
		}),
		magnitude: magnitude,
		isMultipleOf: (other: AmountT) =>
			magnitude.mod(other.magnitude, false).eq(UInt256.valueOf(0)),
		toString: (formatting?: AmountStringFormatting) =>
			toString({
				magnitude: magnitude,
				denomination: Denomination.Atto,
				...formatting,
			}),
		equals: (other: AmountT) => magnitude.eq(other.magnitude),
		greaterThan: (other: AmountT) => magnitude.gt(other.magnitude),
		lessThan: (other: AmountT) => magnitude.lt(other.magnitude),
		greaterThanOrEquals: (other: AmountT) => magnitude.gte(other.magnitude),
		lessThanOrEquals: (other: AmountT) => magnitude.lte(other.magnitude),
		adding: (other: AmountT): Result<AmountT, Error> =>
			doArithmetic(other, addBN),
		subtracting: (other: AmountT): Result<AmountT, Error> =>
			doArithmetic(other, subBN),

		multiplied: (by: AmountT): Result<AmountT, Error> =>
			doArithmetic(by, mulBN),
	}
}

export const expressMagnitudeInLargestDenomination = (
	input: Readonly<{
		magnitude: UInt256
		denomination: Denomination
	}>,
): Readonly<{
	magnitude: UInt256
	denomination: Denomination
}> => {
	// eslint-disable-next-line functional/no-loop-statement
	for (const denomination of denominations) {
		const conversionResult = denominationConversionOfMagnitude({
			magnitude: input.magnitude,
			from: input.denomination,
			to: denomination,
		})
		if (conversionResult.isOk())
			return { magnitude: conversionResult.value, denomination }
	}
	return input
}

const expressMagnitudeInSmallestDenomination = (
	input: Readonly<{
		magnitude: UInt256
		denomination: Denomination
	}>,
): Result<UInt256, Error> =>
	denominationConversionOfMagnitude({
		magnitude: input.magnitude,
		from: input.denomination,
		to: minAmountDenomination,
	})

const denominationConversionOfMagnitude = (
	input: Readonly<{
		magnitude: UInt256
		from: Denomination
		to: Denomination
	}>,
): Result<UInt256, Error> => {
	const from = input.from.valueOf()
	const to = input.to.valueOf()
	const magnitude = input.magnitude

	if (from === to) {
		return ok(magnitude)
	}

	const exponentDelta = Math.abs(to - from)
	const factor = UInt256.valueOf(10).pow(exponentDelta)

	if (from > to) {
		return ok(magnitude.mul(factor))
	}

	const quotientAndRemainder = magnitude.divideAndRemainder(factor)
	const quotient = quotientAndRemainder[0]
	const remainder = quotientAndRemainder[1]
	if (remainder.neq(UInt256.valueOf(0))) {
		return err(new Error('Amount not representable in denomination'))
	}
	return ok(quotient)
}

export type AmountUnsafeInput = UInt256InputUnsafe
export const isAmountUnsafeInput = (
	something: unknown,
): something is AmountUnsafeInput => isUnsafeInputForUInt256(something)

export type AmountOrUnsafeInput = AmountT | AmountUnsafeInput

export const isAmountOrUnsafeInput = (
	something: unknown,
): something is AmountOrUnsafeInput =>
	isAmount(something) || isAmountUnsafeInput(something)

const fromUnsafe = (
	input: AmountOrUnsafeInput,
	denomination: Denomination = Denomination.Atto,
): Result<AmountT, Error> => {
	return isAmount(input)
		? ok(input)
		: isAmountUnsafeInput(input)
		? uint256FromUnsafe(input).andThen((magnitude) =>
				fromUInt256({
					magnitude,
					denomination,
				}),
		  )
		: err(new Error('bad type'))
}

const addBN = (a: BN, b: BN): BN => a.add(b)
const subBN = (a: BN, b: BN): BN => a.sub(b)
const mulBN = (a: BN, b: BN): BN => a.mul(b)

const fromUInt256 = (
	input: Readonly<{
		magnitude: UInt256
		denomination: Denomination
	}>,
): Result<AmountT, Error> => {
	return expressMagnitudeInSmallestDenomination(input).map(
		inSmallestDenomination,
	)
}
/* eslint-enable max-params */

// eslint-disable-next-line complexity
export const isAmount = (
	something: AmountT | unknown,
): something is AmountT => {
	const inspection = something as AmountT
	return (
		inspection.magnitude !== undefined &&
		inspection.isMultipleOf !== undefined &&
		inspection.toString !== undefined &&
		inspection.equals !== undefined &&
		inspection.adding !== undefined
	)
}

const make = (amount: number): AmountT =>
	inSmallestDenomination(UInt256.valueOf(amount))

export const zero = make(0)
export const one = make(1)
export const two = make(2)
export const three = make(3)
export const four = make(4)
export const five = make(5)
export const six = make(6)
export const seven = make(7)
export const eight = make(8)
export const nine = make(9)
export const ten = make(10)
export const eleven = make(11)
export const twelve = make(12)
export const thirteen = make(13)
export const fourteen = make(14)
export const fifteen = make(15)

export const maxAmount = fromUInt256({
	magnitude: uint256Max,
	denomination: Denomination.Atto,
})._unsafeUnwrap()

export const Amount = {
	JSON_TAG,
	...jsonDecoding,
	JSONDecoder,
	inSmallestDenomination,
	fromUnsafe,
	fromUInt256,
	make,
}
