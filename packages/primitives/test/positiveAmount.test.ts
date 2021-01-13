import {
	AmountInputUnsafe,
	Denomination,
	PositiveAmount,
	positiveAmountFromUnsafe,
} from '../src/_index'

const makePosAmount = (unsafe: AmountInputUnsafe): PositiveAmount =>
	positiveAmountFromUnsafe(unsafe, Denomination.Atto)._unsafeUnwrap()

const one = makePosAmount(1)
const two = makePosAmount(2)
const three = makePosAmount(3)

describe('PositiveAmount', () => {
	it('cannot be created with a zero', () => {
		expect(positiveAmountFromUnsafe(0, Denomination.Atto).isErr()).toBe(
			true,
		)
	})

	it('can be created from positive integers', () => {
		expect(one.equals(one)).toBe(true)
		expect(one.adding(two)._unsafeUnwrap().equals(three)).toBe(true)
	})
})
