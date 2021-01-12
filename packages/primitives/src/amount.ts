import { Amount, Denomination, minAmountDenomination } from './_types'
import { UInt256 } from '@radixdlt/uint256'
import { Result, ok, err } from 'neverthrow'

export const expressMagnitudeInSmallestDenomination = (
	input: Readonly<{
		magnitude: UInt256
		denomination: Denomination
	}>,
): Result<UInt256, Error> => {
	const from = input.denomination.valueOf()
	const to = minAmountDenomination
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

export const amountFromUInt256 = (
	input: Readonly<{
		magnitude: UInt256
		denomination: Denomination
	}>,
): Result<Amount, Error> => {
	return expressMagnitudeInSmallestDenomination(input).map(
		(magnitude: UInt256) => ({
			magnitude: magnitude,
			isMultipleOf: (other: Amount) =>
				magnitude.mod(other.magnitude, false).eq(UInt256.valueOf(0)),
			toString: () => magnitude.toString(10),
			equals: (other: Amount) => other.magnitude.eq(magnitude),
			greaterThan: (other: Amount) => other.magnitude.gt(magnitude),
			lessThan: (other: Amount) => other.magnitude.lt(magnitude),
			greaterThanOrEquals: (other: Amount) =>
				other.magnitude.gte(magnitude),
			lessThanOrEquals: (other: Amount) => other.magnitude.lte(magnitude),
		}),
	)
}
