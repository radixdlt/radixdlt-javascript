import {
	AnyUpParticle,
	AtomT,
	RadixParticleType,
	spunParticles,
} from '@radixdlt/atom'
import {
	Amount,
	AmountT,
	Denomination,
	maxAmount,
	zero,
} from '@radixdlt/primitives'
import { FeeEntry, TokenFeeTable } from './_types'
import { err, ok, Result } from 'neverthrow'
import { UInt256 } from '@radixdlt/uint256'
import { decoder, Decoder } from '@radixdlt/data-formats'

const JSONDecoder: Decoder = decoder((value, key) =>
	key === 'fee' && typeof value === 'string'
		? ok(new UInt256(value))
		: undefined,
)

const forAtom = (
	input: Readonly<{
		atom: AtomT
		feeTable?: TokenFeeTable
	}>,
): Result<AmountT, Error> => {
	const feeTable = input.feeTable ?? table
	const atom = input.atom
	const atomDsonResult = atom.toDSON()
	if (atomDsonResult.isErr()) return err(atomDsonResult.error)
	const atomByteCount = atomDsonResult.value.length

	let fee: AmountT = zero
	for (const feeEntry of feeTable.feeEntries) {
		const sumResult = feeEntry
			.feeFor({
				upParticles: atom.upParticles(),
				atomByteCount,
			})
			.andThen((feeThisEntry: AmountT) => fee.adding(feeThisEntry))
		if (sumResult.isErr()) return err(sumResult.error)
		fee = sumResult.value
	}

	const minFee = feeTable.minimumFee
	return ok(fee.lessThan(minFee) ? minFee : fee)
}

const milliRads = (mXRD: number): AmountT =>
	Amount.fromUInt256({
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
		): Result<AmountT, Error> => {
			const atomByteCount = input.atomByteCount
			if (!atomByteCount || !Number.isInteger(atomByteCount)) {
				return err(new Error(`atomByteCount be a defined number.`))
			}

			if (atomByteCount <= threshold) {
				return ok(zero)
			}

			const numberOfBytesExceedingThreshold = atomByteCount - threshold

			return Amount.fromUInt256({
				magnitude: UInt256.valueOf(
					numberOfBytesExceedingThreshold * feeMagnitude,
				),
				denomination: denomination,
			})
		},
	}
}

const perParticleFeeEntry = (
	input: Readonly<{
		particleType: RadixParticleType
		exceedingCount: number
		fee: number
		inDenomination: Denomination
	}>,
): FeeEntry => {
	const feeMagnitude = input.fee
	if (!feeMagnitude || !Number.isInteger(feeMagnitude)) {
		throw new Error(`Fee be a defined number.`)
	}

	const denomination = input.inDenomination
	const particleType = input.particleType
	const particleCountThreshold = input.exceedingCount
	return {
		feeFor: (
			input: Readonly<{
				upParticles: AnyUpParticle[]
				atomByteCount: number
			}>,
		): Result<AmountT, Error> => {
			const particleCount = spunParticles(
				input.upParticles,
			).anySpunParticlesOfTypeWithSpin({ particleTypes: [particleType] })
				.length

			if (particleCount <= particleCountThreshold) {
				return ok(zero)
			}

			const particleCountExceedingThreshold =
				particleCount - particleCountThreshold

			return Amount.fromUInt256({
				magnitude: UInt256.valueOf(
					particleCountExceedingThreshold * feeMagnitude,
				),
				denomination,
			})
		},
	}
}

const minimumFee = milliRads(40)

const table: TokenFeeTable = {
	minimumFee,
	feeEntries: [
		perBytesFeeEntry({
			fee: 1,
			inDenomination: Denomination.Milli,
			afterByteCountThresholdOfIsExceeded: 3072,
		}),

		perParticleFeeEntry({
			particleType: RadixParticleType.FIXED_SUPPLY_TOKEN_DEFINITION,
			exceedingCount: 0,
			fee: 1000,
			inDenomination: Denomination.Milli,
		}),

		perParticleFeeEntry({
			particleType: RadixParticleType.MUTABLE_SUPPLY_TOKEN_DEFINITION,
			exceedingCount: 0,
			fee: 1000,
			inDenomination: Denomination.Milli,
		}),
	],
}

export const TokenFee = {
	table,
	milliRads,
	forAtom,
	JSONDecoder,
	minimumFee,
}
