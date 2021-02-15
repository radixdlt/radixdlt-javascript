import {
	Amount,
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
import { denominations, formatDenomination } from './denomination'
import { DSONObjectEncoding } from '@radixdlt/data-formats'
import { Byte } from '@radixdlt/util'

export const CBOR_BYTESTRING_PREFIX: Byte = 5

export const min = (lhs: Amount, rhs: Amount): Amount =>
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

export const amountInSmallestDenomination = (magnitude: UInt256): Amount => {
	/* eslint-disable max-params */
	const doArithmetic = (
		other: Amount,
		operation: (a: BN, b: BN) => BN,
	): Result<Amount, Error> => {
		const selfBN = bnFromUInt256(magnitude)
		const otherBN = bnFromUInt256(other.magnitude)
		const arithmeticResult = operation(selfBN, otherBN)
		return uint256FromBN(arithmeticResult)
			.map((foo) => ({
				magnitude: foo,
				denomination: Denomination.Atto,
			}))
			.andThen(amountFromUInt256)
	}

	const buffer = bnFromUInt256(magnitude).toBuffer('be', 32)

	return {
		...DSONObjectEncoding({
			prefix: CBOR_BYTESTRING_PREFIX,
			buffer,
		}),
		magnitude: magnitude,
		isMultipleOf: (other: Amount) =>
			magnitude.mod(other.magnitude, false).eq(UInt256.valueOf(0)),
		toString: (formatting?: AmountStringFormatting) =>
			toString({
				magnitude: magnitude,
				denomination: Denomination.Atto,
				...formatting,
			}),
		equals: (other: Amount) => magnitude.eq(other.magnitude),
		greaterThan: (other: Amount) => magnitude.gt(other.magnitude),
		lessThan: (other: Amount) => magnitude.lt(other.magnitude),
		greaterThanOrEquals: (other: Amount) => magnitude.gte(other.magnitude),
		lessThanOrEquals: (other: Amount) => magnitude.lte(other.magnitude),
		adding: (other: Amount): Result<Amount, Error> =>
			doArithmetic(other, addBN),
		subtracting: (other: Amount): Result<Amount, Error> =>
			doArithmetic(other, subBN),

		multiplied: (by: Amount): Result<Amount, Error> =>
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

export type AmountInputUnsafe = UInt256InputUnsafe

export const amountFromUnsafe = (
	input: Amount | AmountInputUnsafe,
	denomination: Denomination = Denomination.Whole,
): Result<Amount, Error> => {
	return isAmount(input)
		? ok(input)
		: isUnsafeInputForUInt256(input)
		? uint256FromUnsafe(input).andThen((magnitude) =>
				amountFromUInt256({
					magnitude,
					denomination,
				}),
		  )
		: err(new Error('bad type'))
}

const addBN = (a: BN, b: BN): BN => a.add(b)
const subBN = (a: BN, b: BN): BN => a.sub(b)
const mulBN = (a: BN, b: BN): BN => a.mul(b)

export const amountFromUInt256 = (
	input: Readonly<{
		magnitude: UInt256
		denomination: Denomination
	}>,
): Result<Amount, Error> => {
	return expressMagnitudeInSmallestDenomination(input).map(
		amountInSmallestDenomination,
	)
}
/* eslint-enable max-params */

// eslint-disable-next-line complexity
export const isAmount = (something: Amount | unknown): something is Amount => {
	const inspection = something as Amount
	return (
		inspection.magnitude !== undefined &&
		inspection.isMultipleOf !== undefined &&
		inspection.toString !== undefined &&
		inspection.equals !== undefined &&
		inspection.adding !== undefined
	)
}

const makeAmount = (amount: number): Amount =>
	amountInSmallestDenomination(UInt256.valueOf(amount))

export const zero = makeAmount(0)
export const one = makeAmount(1)
export const two = makeAmount(2)
export const three = makeAmount(3)
export const four = makeAmount(4)
export const five = makeAmount(5)
export const six = makeAmount(6)
export const seven = makeAmount(7)
export const eight = makeAmount(8)
export const nine = makeAmount(9)
export const ten = makeAmount(10)
export const eleven = makeAmount(11)
export const twelve = makeAmount(12)
export const thirteen = makeAmount(13)
export const fourteen = makeAmount(14)
export const fifteen = makeAmount(15)

export const maxAmount = amountFromUInt256({
	magnitude: uint256Max,
	denomination: Denomination.Atto,
})._unsafeUnwrap()
