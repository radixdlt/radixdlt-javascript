import {
	Atom,
	atomWithSpunParticles,
	resourceIdentifierFromAddressAndName,
	spunUpParticle,
	TransferrableTokensParticle,
	transferrableTokensParticle
} from "@radixdlt/atom";
import { toAddress } from "../../atom/test/helpers/utility";
import {
	Amount,
	amountFromUInt256,
	amountInSmallestDenomination,
	Denomination,
	isAmount,
	one
} from "@radixdlt/primitives";
import { UInt256 } from "@radixdlt/uint256";
import { makeTokenFeeProvider, minimumFee } from "../src/tokenFeeProvider";

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

	const aliceCoin = resourceIdentifierFromAddressAndName({
		address: alice,
		name: 'ALICE',
	})

	type AmountLike = number | Amount
	const makeAmount = (amount: AmountLike): Amount =>
		isAmount(amount)
			? amount
			: amountInSmallestDenomination(UInt256.valueOf(amount))

	const makeTTP = (amount: AmountLike): TransferrableTokensParticle =>
		transferrableTokensParticle({
			amount: makeAmount(amount),
			granularity: one,
			resourceIdentifier: aliceCoin,
			address: bob,
		})._unsafeUnwrap()

	const atomWithTTPCountOf = (ttpCount: number): Atom => {
		const particles = Array.from(Range(ttpCount, 1, 1))
			.map(makeTTP)
			.map(spunUpParticle)

		return atomWithSpunParticles({ spunParticles: particles })
	}

	const feeTestAssert = (
		ttpCount: number,
		assertAmount: (amt: Amount) => void,
	): void => {
		const atom_ = atomWithTTPCountOf(ttpCount)
		const feeProvider = makeTokenFeeProvider()
		const fee = feeProvider.feeFor({ atom: atom_ })._unsafeUnwrap()
		console.log(`🔮💵 calculated fee: ${fee.toString()}`)
		assertAmount(fee)
	}

	const feeTest = (expectedFee: number | Amount, ttpCount: number): void => {
		const expected = isAmount(expectedFee) ? expectedFee : amountFromUInt256({ magnitude: UInt256.valueOf(expectedFee), denomination: Denomination.Milli })._unsafeUnwrap()
		feeTestAssert(ttpCount, (fee: Amount) => {
			console.log(`💵 expected fee: ${expected.toString()}`)
			expect(fee.equals(expected)).toBe(true)
		})
	}

	it('should be minimumFee for 1 ttp', () => {
		feeTest(minimumFee, 1)
	})

	it('should be min for 8 ttp', () => {
		feeTest(minimumFee, 8)
	})

	it('should be over min fee for 9 ttp', () => {
		feeTestAssert(9, (fee: Amount) => {
			expect(fee.greaterThan(minimumFee)).toBe(true)
		})
	})
})
