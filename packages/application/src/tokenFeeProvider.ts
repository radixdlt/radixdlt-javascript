import { AnyUpParticle, Atom } from '@radixdlt/atom'
import {
	Amount,
	amountFromUInt256,
	Denomination,
	maxAmount,
	zero,
} from '@radixdlt/primitives'
import { FeeEntry, TokenFeeProvider, TokenFeeTable } from './_types'
import { err, ok, Result } from 'neverthrow'
import { UInt256 } from '@radixdlt/uint256'

export const tokenFeeProvider = (
	feeTable: TokenFeeTable,
): TokenFeeProvider => ({
	feeFor: (input: Readonly<{ atom: Atom }>): Result<Amount, Error> => {
		const atom = input.atom
		const atomDsonResult = atom.toDSON()
		if (atomDsonResult.isErr()) return err(atomDsonResult.error)
		const atomByteCount = atomDsonResult.value.length

		/* eslint-disable */
		let fee: Amount = zero
		for (const feeEntry of feeTable.feeEntries) {
			const sumResult = feeEntry
				.feeFor({
					upParticles: atom.upParticles(),
					atomByteCount,
				})
				.andThen((feeThisEntry: Amount) => fee.adding(feeThisEntry))
			if (sumResult.isErr()) return err(sumResult.error)
			fee = sumResult.value
		}
		/* eslint-enable */
		const minFee = feeTable.minimumFee
		return ok(fee.lessThan(minFee) ? minFee : fee)
	},
})

export const milliRads = (mXRD: number): Amount =>
	amountFromUInt256({
		magnitude: UInt256.valueOf(mXRD),
		denomination: Denomination.Milli,
	}).unwrapOr(maxAmount) // will cause overflow so error propagated.

// eslint-disable-next-line max-lines-per-function
const perBytesFeeEntry = (
	input: Readonly<{
		fee: number
		inDenomination: Denomination
		afterByteCountThresholdOfIsExceeded: number
	}>,
): FeeEntry => {
	const threshold = input.afterByteCountThresholdOfIsExceeded

	if (!threshold || !Number.isInteger(threshold)) {
		throw new Error(`Threshold be a defined number.`)
	}

	const feeMagnitude = input.fee
	if (!feeMagnitude || !Number.isInteger(feeMagnitude)) {
		throw new Error(`Fee be a defined number.`)
	}

	const denomination = input.inDenomination

	return {
		feeFor: (
			input: Readonly<{
				upParticles: AnyUpParticle[]
				atomByteCount: number
			}>,
		): Result<Amount, Error> => {
			return amountFromUInt256({
				magnitude: UInt256.valueOf(feeMagnitude),
				denomination: denomination,
			}).andThen((fee) => {
				const atomByteCount = input.atomByteCount
				if (!atomByteCount || !Number.isInteger(atomByteCount)) {
					return err(new Error(`atomByteCount be a defined number.`))
				}

				if (atomByteCount <= threshold) {
					return ok(zero)
				}

				const numberOfBytesExceedingThreshold =
					atomByteCount - threshold
				return amountFromUInt256({
					magnitude: UInt256.valueOf(numberOfBytesExceedingThreshold),
					denomination: denomination,
				}).andThen((overThresholdAmount: Amount) => {
					return fee.multiplied(overThresholdAmount)
				})
			})
		},
	}
}

export const minimumFee = milliRads(40)

export const tokenFeeTable: TokenFeeTable = {
	minimumFee,
	feeEntries: [
		perBytesFeeEntry({
			fee: 1,
			inDenomination: Denomination.Milli,
			afterByteCountThresholdOfIsExceeded: 3072,
		}),
	],
}

export const makeTokenFeeProvider = (): TokenFeeProvider =>
	tokenFeeProvider(tokenFeeTable)
