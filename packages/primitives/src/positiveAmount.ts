import { Amount, PositiveAmount } from './_types'
import { UInt256 } from '@radixdlt/uint256'
import { Result, ok, err } from 'neverthrow'

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
