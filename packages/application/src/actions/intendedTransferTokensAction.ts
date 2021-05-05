import {
	ActionType,
	IntendedTransferTokensAction,
	TransferTokensInput,
} from './_types'
import {
	AccountAddress,
	AccountAddressT,
	isSigningKeyAddressOrUnsafeInput,
	ResourceIdentifierT,
	ResourceIdentifier,
	isResourceIdentifierOrUnsafeInput,
} from '@radixdlt/account'
import { Amount, AmountT, isAmountOrUnsafeInput } from '@radixdlt/primitives'
import { combine, Result } from 'neverthrow'

export const isTransferTokensInput = (
	something: unknown,
): something is TransferTokensInput => {
	const inspection = something as TransferTokensInput
	return (
		isSigningKeyAddressOrUnsafeInput(inspection.to) &&
		isAmountOrUnsafeInput(inspection.amount) &&
		isResourceIdentifierOrUnsafeInput(inspection.tokenIdentifier)
	)
}

export const create = (
	input: TransferTokensInput,
	from: AccountAddressT,
): Result<IntendedTransferTokensAction, Error> => {
	return combine([
		AccountAddress.fromUnsafe(input.to),
		Amount.fromUnsafe(input.amount),
		ResourceIdentifier.fromUnsafe(input.tokenIdentifier),
	]).map(
		(resultList): IntendedTransferTokensAction => {
			const to = resultList[0] as AccountAddressT
			const amount = resultList[1] as AmountT
			const rri = resultList[2] as ResourceIdentifierT

			return {
				to,
				amount,
				rri,
				type: ActionType.TOKEN_TRANSFER,
				from,
			}
		},
	)
}

export const IntendedTransferTokens = {
	create,
}
