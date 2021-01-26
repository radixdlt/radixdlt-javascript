import { UInt256 } from '@radixdlt/uint256'
import { amountFromUInt256 } from '../src/amount'
import {
	Amount,
	amountFromUnsafe,
	AmountInputUnsafe,
	Denomination,
	maxAmount,
} from '../src/_index'

const makeAmount = (unsafe: AmountInputUnsafe): Amount =>
	amountFromUnsafe(unsafe, Denomination.Atto)._unsafeUnwrap()

const zero = makeAmount(0)
const one = makeAmount(1)
const two = makeAmount(2)
const three = makeAmount(3)
const four = makeAmount(4)
const five = makeAmount(5)

describe('Amount', () => {
	it('should consider same numbers expressed in different denomination as equal', () => {
		const amount = amountFromUnsafe(42)._unsafeUnwrap()
		const amountFromAtto = amountFromUnsafe(
			'42' + '0'.repeat(18),
			Denomination.Atto,
		)._unsafeUnwrap()
		expect(amount.equals(amountFromAtto)).toBe(true)
	})

	it('should consider large magnitude of tiny denomination less than small magnitude of large denomination', () => {
		const small = amountFromUnsafe(
			1_000_000,
			Denomination.Atto,
		)._unsafeUnwrap()
		const large = amountFromUnsafe(10, Denomination.Whole)._unsafeUnwrap()

		expect(small.equals(large)).toBe(false)
		expect(small.lessThan(large)).toBe(true)
		expect(small.lessThanOrEquals(large)).toBe(true)

		expect(large.lessThan(small)).toBe(false)
		expect(large.lessThanOrEquals(small)).toBe(false)

		expect(large.greaterThan(small)).toBe(true)
		expect(large.greaterThanOrEquals(small)).toBe(true)
	})

	it('can perform addition', () => {
		const add = (lhs: Amount, rhs: Amount): Amount =>
			lhs.adding(rhs)._unsafeUnwrap()

		const sumOneAndTwo = add(one, two)
		expect(sumOneAndTwo.equals(three)).toBe(true)
		expect(sumOneAndTwo.greaterThan(two)).toBe(true)
		expect(sumOneAndTwo.lessThan(four)).toBe(true)

		expect(add(two, two).equals(four)).toBe(true)
		expect(add(two, three).equals(five)).toBe(true)

		expect(maxAmount.adding(one).isErr()).toBe(true)
	})

	it('can perform subtaction', () => {
		const sub = (lhs: Amount, rhs: Amount): Amount =>
			lhs.subtracting(rhs)._unsafeUnwrap()

		const fiveMinusThree = sub(five, three)
		expect(fiveMinusThree.equals(two)).toBe(true)

		expect(sub(two, two).equals(zero)).toBe(true)
		expect(sub(two, one).equals(one)).toBe(true)

		expect(zero.subtracting(one).isErr()).toBe(true)
	})

	it('can check for multiples', () => {
		expect(four.isMultipleOf(two)).toBe(true)
		expect(four.isMultipleOf(three)).toBe(false)
	})

	it('should be able to DSON encode amount in denomination whole', () => {
		const amount = amountFromUInt256({
			magnitude: UInt256.valueOf(6),
			denomination: Denomination.Whole,
		})._unsafeUnwrap()

		const expected =
			'58210500000000000000000000000000000000000000000000000053444835ec580000'
		const dson = amount.toDSON()._unsafeUnwrap()

		expect(dson.toString('hex')).toBe(expected)
	})

	it('should be able to DSON encode amount in denomination atto', () => {
		const amount = amountFromUInt256({
			magnitude: UInt256.valueOf(7),
			denomination: Denomination.Atto,
		})._unsafeUnwrap()

		const expected =
			'5821050000000000000000000000000000000000000000000000000000000000000007'
		const dson = amount.toDSON()._unsafeUnwrap()

		expect(dson.toString('hex')).toBe(expected)
	})
})
