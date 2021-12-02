import {
	Action,
	ActionType,
	IntendedTransferTokensAction,
	Transfer,
	TransferTokensInput,
} from './_types'
import {
	AccountAddress,
	AccountAddressT,
	isAccountAddressOrUnsafeInput,
	ResourceIdentifierT,
	ResourceIdentifier,
	isResourceIdentifierOrUnsafeInput,
} from '@account'
import { Amount, AmountT, isAmountOrUnsafeInput } from '@primitives'
import { combineWithAllErrors, Result } from 'neverthrow'
import { PrimitiveFrom } from '../_types'

export const isTransferTokensInput = (
	something: unknown,
): something is TransferTokensInput => {
	const inspection = something as TransferTokensInput
	return (
		isAccountAddressOrUnsafeInput(inspection.to_account) &&
		isAmountOrUnsafeInput(inspection.amount) &&
		isResourceIdentifierOrUnsafeInput(inspection.tokenIdentifier)
	)
}

const create = (
	input: Omit<PrimitiveFrom<Transfer>, 'type' | 'amount'> & {
		amount: string
	},
): Result<Transfer, Error[]> =>
	combineWithAllErrors([
		AccountAddress.fromUnsafe(input.from_account),
		AccountAddress.fromUnsafe(input.to_account),
		Amount.fromUnsafe(input.amount),
		ResourceIdentifier.fromUnsafe(input.rri),
	]).map(results => ({
		from_account: results[0] as AccountAddressT,
		to_account: results[1] as AccountAddressT,
		amount: results[2] as AmountT,
		rri: results[3] as ResourceIdentifierT,
		type: ActionType.TRANSFER,
	}))

const toPrimitive = (action: Transfer) => ({
	type: ActionType.TRANSFER,
	from_account: {
		address: action.from_account.toPrimitive(),
	},
	to_account: {
		address: action.to_account.toPrimitive(),
	},
	amount: {
		value: action.amount.toPrimitive(),
		token_identifier: {
			rri: action.rri.toPrimitive(),
		},
	},
})

export const IntendedTransferTokens = {
	create,
	toPrimitive,
}
