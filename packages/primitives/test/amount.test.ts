import { UInt256 } from '@radixdlt/uint256'
import { isUInt256 } from '../src'
import { Amount } from '../src/amount'

describe('Amount', () => {
	it('can check for multiple with granularity', () => {
		const granularity = Amount.fromUnsafe(1)._unsafeUnwrap()
		const amount = Amount.fromUnsafe(10)._unsafeUnwrap()

		expect(Amount.isAmountMultipleOf({ amount, granularity })).toBe(true)
		expect(
			Amount.isAmountMultipleOf({
				amount: granularity,
				granularity: amount,
			}),
		).toBe(false)
	})

	it('can typeguard UInt256', () => {
		const uOne = UInt256.valueOf(1)
		expect(isUInt256(uOne)).toBe(true)
		expect(isUInt256(1)).toBe(false)
	})
})
