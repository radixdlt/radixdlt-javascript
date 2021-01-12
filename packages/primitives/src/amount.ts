import { Amount, Denomination, minAmountDenomination } from './_types'
import { UInt256 } from '@radixdlt/uint256'
import { Result, ok, err } from 'neverthrow'
import BN from 'bn.js'
import {
	bnFromUInt256,
	uint256FromUnsafe,
	uint256FromBN,
	UInt256InputUnsafe,
	uint256Max,
} from './uint256'

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

export type AmountInputUnsafe = UInt256InputUnsafe

/* eslint-disable max-params */
export const amountFromUnsafe = (
	unsafe: AmountInputUnsafe,
	denomination: Denomination = Denomination.Whole,
): Result<Amount, Error> =>
	uint256FromUnsafe(unsafe).andThen((magnitude) =>
		amountFromUInt256({
			magnitude,
			denomination,
		}),
	)

const addBN = (a: BN, b: BN): BN => a.add(b)
const subBN = (a: BN, b: BN): BN => a.sub(b)

export const amountFromUInt256 = (
	input: Readonly<{
		magnitude: UInt256
		denomination: Denomination
	}>,
): Result<Amount, Error> => {
	return expressMagnitudeInSmallestDenomination(input).map(
		(magnitude: UInt256) => {
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

			return {
				magnitude: magnitude,
				isMultipleOf: (other: Amount) =>
					magnitude
						.mod(other.magnitude, false)
						.eq(UInt256.valueOf(0)),
				toString: () => magnitude.toString(10),
				equals: (other: Amount) => magnitude.eq(other.magnitude),
				greaterThan: (other: Amount) => magnitude.gt(other.magnitude),
				lessThan: (other: Amount) => magnitude.lt(other.magnitude),
				greaterThanOrEquals: (other: Amount) =>
					magnitude.gte(other.magnitude),
				lessThanOrEquals: (other: Amount) =>
					magnitude.lte(other.magnitude),
				adding: (other: Amount): Result<Amount, Error> =>
					doArithmetic(other, addBN),
				subtracting: (other: Amount): Result<Amount, Error> =>
					doArithmetic(other, subBN),
			}
		},
	)
}
/* eslint-enable max-params */

export const maxAmount = amountFromUInt256({
	magnitude: uint256Max,
	denomination: Denomination.Atto,
})._unsafeUnwrap()
