import { Amount, Denomination, PositiveAmount } from './_types'
import { UInt256 } from '@radixdlt/uint256'
import { Result, ok, err } from 'neverthrow'
import { amountFromUnsafe, AmountInputUnsafe } from './amount'

export const positiveAmount = (
	amount: Amount,
): Result<PositiveAmount, Error> => {
	if (amount.magnitude.eq(UInt256.valueOf(0))) {
		return err(new Error('Amount is not positive'))
	}

	return ok({
		...amount,
		witness: 'Amount is positive',
	})
}

/* eslint-disable max-params */
export const positiveAmountFromUnsafe = (
	unsafe: AmountInputUnsafe,
	denomination: Denomination = Denomination.Whole,
): Result<PositiveAmount, Error> =>
	amountFromUnsafe(unsafe, denomination).andThen(positiveAmount)

/* eslint-enable max-params */
