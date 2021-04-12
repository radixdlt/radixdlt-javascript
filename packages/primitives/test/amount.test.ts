import { UInt256 } from '@radixdlt/uint256'
import { AmountT } from '../src/_types'
import {
	Amount,
	eight,
	eleven,
	fifteen,
	five,
	four,
	fourteen,
	min,
	nine,
	one,
	seven,
	six,
	ten,
	thirteen,
	three,
	twelve,
	two,
	zero,
} from '../src/amount'
import {
	Denomination,
	DenominationOutputFormat,
	Granularity,
	isUInt256,
	maxAmount,
} from '../src/_index'

describe('Amount', () => {
	it('have correct values and equal itself', () => {
		;[
			zero,
			one,
			two,
			three,
			four,
			five,
			six,
			seven,
			eight,
			nine,
			ten,
			eleven,
			twelve,
			thirteen,
			fourteen,
			fifteen,
		].forEach((amount, index) => {
			expect(amount.magnitude.valueOf()).toBe(index)
			expect(amount.equals(amount)).toBe(true)
			expect(
				amount.equals(
					Amount.inSmallestDenomination(UInt256.valueOf(index)),
				),
			).toBe(true)
		})
	})

	it('should consider same numbers expressed in different denomination as equal', () => {
		const amountFromAtto = Amount.fromUnsafe(
			'42' + '0'.repeat(18),
		)._unsafeUnwrap()
		const amountFromWhole = Amount.fromUnsafe(
			42,
			Denomination.Whole,
		)._unsafeUnwrap()
		expect(amountFromWhole.equals(amountFromAtto)).toBe(true)
	})

	it('should consider large magnitude of tiny denomination less than small magnitude of large denomination', () => {
		const small = Amount.fromUnsafe(
			1_000_000,
			Denomination.Atto,
		)._unsafeUnwrap()
		const large = Amount.fromUnsafe(10, Denomination.Whole)._unsafeUnwrap()

		expect(small.equals(large)).toBe(false)
		expect(small.lessThan(large)).toBe(true)
		expect(small.lessThanOrEquals(large)).toBe(true)

		expect(large.lessThan(small)).toBe(false)
		expect(large.lessThanOrEquals(small)).toBe(false)

		expect(large.greaterThan(small)).toBe(true)
		expect(large.greaterThanOrEquals(small)).toBe(true)
	})

	it('can perform addition', () => {
		const add = (lhs: AmountT, rhs: AmountT): AmountT =>
			lhs.adding(rhs)._unsafeUnwrap()

		const sumOneAndTwo = add(one, two)
		expect(sumOneAndTwo.equals(three)).toBe(true)
		expect(sumOneAndTwo.greaterThan(two)).toBe(true)
		expect(sumOneAndTwo.lessThan(four)).toBe(true)

		expect(add(two, two).equals(four)).toBe(true)
		expect(add(two, three).equals(five)).toBe(true)

		expect(maxAmount.adding(one).isErr()).toBe(true)
	})

	it('can perform subtraction', () => {
		const sub = (lhs: AmountT, rhs: AmountT): AmountT =>
			lhs.subtracting(rhs)._unsafeUnwrap()

		const fiveMinusThree = sub(five, three)
		expect(fiveMinusThree.equals(two)).toBe(true)

		expect(sub(two, two).equals(zero)).toBe(true)
		expect(sub(two, one).equals(one)).toBe(true)

		expect(zero.subtracting(one).isErr()).toBe(true)
	})

	it('should be able to do multiplication', () => {
		const mul = (lhs: AmountT, rhs: AmountT): AmountT =>
			lhs.multiplied(rhs)._unsafeUnwrap()

		const fiveTimesThree = mul(five, three)
		expect(fiveTimesThree.equals(fifteen)).toBe(true)

		expect(mul(two, two).equals(four)).toBe(true)
		expect(mul(two, one).equals(two)).toBe(true)
	})

	it('can check for multiples', () => {
		expect(four.isMultipleOf(two)).toBe(true)
		expect(four.isMultipleOf(three)).toBe(false)
	})

	it('can check for multiple with granularity', () => {
		const granularity: Granularity = Amount.fromUInt256({
			magnitude: UInt256.valueOf(1),
			denomination: Denomination.Atto,
		})._unsafeUnwrap()

		const supply = Amount.fromUInt256({
			magnitude: UInt256.valueOf(10),
			denomination: Denomination.Atto,
		})._unsafeUnwrap()

		expect(supply.isMultipleOf(granularity)).toBe(true)
		expect(granularity.isMultipleOf(supply)).toBe(false)
	})

	it('should be possible to find min of two amounts', () => {
		expect(min(two, five).equals(two))
		expect(min(five, two).equals(two))
		expect(min(zero, two).equals(zero))
		expect(min(three, three).equals(three))
	})

	it('can typeguard UInt256', () => {
		const uOne = UInt256.valueOf(1)
		expect(isUInt256(uOne)).toBe(true)
		expect(isUInt256(1)).toBe(false)
	})

	describe('amount toString', () => {
		const doTestToString = (
			magnitude: number,
			denomination: Denomination,
			expected: string,
		): void => {
			const amount = Amount.fromUnsafe(
				magnitude,
				denomination,
			)._unsafeUnwrap()
			expect(
				amount.toString({
					useLargestDenomination: true,
					denominationOutputFormat:
						DenominationOutputFormat.SHOW_NAME,
				}),
			).toBe(expected)
		}

		it(`(1 exa).toString(useLargestDenomination: true) => '1 Exa'`, () => {
			doTestToString(1, Denomination.Exa, '1 Exa')
		})

		it(`(2_000 peta).toString(useLargestDenomination: true) => '2 Exa'`, () => {
			doTestToString(2_000, Denomination.Peta, '2 Exa')
		})

		it(`(30_000 tera).toString(useLargestDenomination: true) => '30 Peta'`, () => {
			doTestToString(30_000, Denomination.Tera, '30 Peta')
		})

		it(`(400_000 giga).toString(useLargestDenomination: true) => '400 Tera'`, () => {
			doTestToString(400_000, Denomination.Giga, '400 Tera')
		})

		it(`(5_000_000 mega).toString(useLargestDenomination: true) => '5 Tera'`, () => {
			doTestToString(5_000_000, Denomination.Mega, '5 Tera')
		})
	})
})
