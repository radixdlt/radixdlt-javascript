import {
	MutableSupplyTokenDefinitionParticle,
	ParticleBase,
	spunUpParticle,
	TokenDefinitionParticleInput,
	tokenPermissionsAll,
	TransferrableTokensParticle,
} from '@radixdlt/atom'
import { toAddress } from '../../atom/test/helpers/utility'
import {
	AmountT,
	Denomination,
	granularityDefault,
	isAmount,
	one,
} from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'
import { atomWithSpunParticles } from './atomFromParticles'
import {
	AtomT,
	FixedSupplyTokenDefinitionParticle,
	FixedSupplyTokenDefinitionParticleT,
	MutableSupplyTokenDefinitionParticleT,
	ResourceIdentifier,
	TransferrableTokensParticleT,
} from '@radixdlt/atom/src/_index'
import { Amount } from '@radixdlt/primitives/src/amount'
import { TokenFee } from '../src/tokenFee'

const Range = function* (total = 0, step = 1, from = 0) {
	for (let i = 0; i < total; yield from + i++ * step) {}
}

describe('TokenFees', () => {
	const alice = toAddress(
		'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
	)

	const bob = toAddress(
		'9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
	)

	const aliceCoin = ResourceIdentifier.fromAddressAndName({
		address: alice,
		name: 'ALICE',
	})

	type AmountLike = number | AmountT
	const makeAmount = (amount: AmountLike): AmountT =>
		isAmount(amount)
			? amount
			: Amount.inSmallestDenomination(UInt256.valueOf(amount))

	type ParticleFromNum<P extends ParticleBase> = (num: number) => P

	const makeTTP = (amount: number): TransferrableTokensParticleT =>
		TransferrableTokensParticle.create({
			amount: makeAmount(amount),
			granularity: one,
			resourceIdentifier: aliceCoin,
			address: bob,
		})._unsafeUnwrap()

	const makeTokenDefInput = (
		symbolNumSuffix: number,
	): TokenDefinitionParticleInput => ({
		symbol: `FOO${symbolNumSuffix}`,
		name: `FOO${symbolNumSuffix}`,
		address: alice,
		granularity: granularityDefault,
	})

	const makeFSTDP = (
		symbolNumSuffix: number,
	): FixedSupplyTokenDefinitionParticleT =>
		FixedSupplyTokenDefinitionParticle.create({
			...makeTokenDefInput(symbolNumSuffix),
			supply: Amount.fromUnsafe(21_000_000)._unsafeUnwrap(),
		})._unsafeUnwrap()

	const makeMSTDP = (
		symbolNumSuffix: number,
	): MutableSupplyTokenDefinitionParticleT =>
		MutableSupplyTokenDefinitionParticle.create({
			...makeTokenDefInput(symbolNumSuffix),
			permissions: tokenPermissionsAll.permissions,
		})._unsafeUnwrap()

	const atomWithParticleCountOf = <P extends ParticleBase>(
		makeParticle: ParticleFromNum<P>,
		ttpCount: number,
	): AtomT => {
		const particles = Array.from(Range(ttpCount, 1, 1))
			.map(makeParticle)
			.map(spunUpParticle)

		return atomWithSpunParticles({ spunParticles: particles })
	}

	const atomWithTTPCountOf = atomWithParticleCountOf.bind(null, makeTTP)

	const testTTPAssert = (
		ttpCount: number,
		assertAmount: (amt: AmountT) => void,
	): void => {
		const atom_ = atomWithTTPCountOf(ttpCount)
		const fee = TokenFee.forAtom({ atom: atom_ })._unsafeUnwrap()
		assertAmount(fee)
	}

	const testTTP = (expectedFee: number | AmountT, ttpCount: number): void => {
		const expected = isAmount(expectedFee)
			? expectedFee
			: Amount.fromUInt256({
					magnitude: UInt256.valueOf(expectedFee),
					denomination: Denomination.Milli,
			  })._unsafeUnwrap()
		testTTPAssert(ttpCount, (fee: AmountT) => {
			expect(fee.equals(expected)).toBe(true)
		})
	}

	const testFeeWithParticleCountOf = <P extends ParticleBase>(
		makeParticle: ParticleFromNum<P>,
		particleCount: number,
		expectedFee: number | ((feeToAssert: AmountT) => void),
	): void => {
		const atom_ = atomWithParticleCountOf(makeParticle, particleCount)

		const fee = TokenFee.forAtom({ atom: atom_ })._unsafeUnwrap()

		if (typeof expectedFee === 'number') {
			const expected = isAmount(expectedFee)
				? expectedFee
				: Amount.fromUInt256({
						magnitude: UInt256.valueOf(expectedFee),
						denomination: Denomination.Milli,
				  })._unsafeUnwrap()

			expect(fee.equals(expected)).toBe(true)
		} else {
			expectedFee(fee)
		}
	}

	const testMSTDP = testFeeWithParticleCountOf.bind(null, makeMSTDP)
	const testFSTDP = testFeeWithParticleCountOf.bind(null, makeFSTDP)

	it('should be minimumFee for empty atom', () => {
		testTTP(TokenFee.minimumFee, 0)
	})

	it('should be minimumFee for 1 ttp', () => {
		testTTP(TokenFee.minimumFee, 1)
	})

	it('should be min for 8 ttp', () => {
		testTTP(TokenFee.minimumFee, 8)
	})

	it('should be over min fee for 9 ttp', () => {
		testTTPAssert(9, (fee: AmountT) => {
			expect(fee.greaterThan(TokenFee.minimumFee)).toBe(true)
		})
	})

	it('should be 1000 Milli for 1 FixedSupTokenDefPart', () => {
		testFSTDP(1, 1000)
	})

	it('should be 2000 Milli for 2 FixedSupTokenDefPart', () => {
		testFSTDP(2, 2000)
	})

	it('should be 7000 Milli for 7 FixedSupTokenDefPart', () => {
		testFSTDP(7, 7000)
	})

	it('should be more than 15 for 15 FixedSupTokenDefPart due to size of atom', () => {
		testFSTDP(15, (fee: AmountT) => {
			expect(fee.greaterThan(TokenFee.milliRads(15_000)))
		})
	})

	it('should be 1000 Milli for 1 MutableSupTokenDefPart', () => {
		testMSTDP(1, 1000)
	})

	it('should be 2000 Milli for 2 MutableSupTokenDefPart', () => {
		testMSTDP(2, 2000)
	})

	it('should be 7000 Milli for 7 MutableSupTokenDefPart', () => {
		testMSTDP(7, 7000)
	})
})
