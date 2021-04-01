import {
	ActionType,
	IntendedTransferTokensAction,
	TransferTokensInput,
} from './_types'
import { v4 as uuidv4 } from 'uuid'
import { Address, AddressT, isAddressOrUnsafeInput } from '@radixdlt/account'
import {
	Amount,
	AmountT,
	Denomination,
	isAmountOrUnsafeInput,
} from '@radixdlt/primitives'
import {
	isResourceIdentifierOrUnsafeInput,
	ResourceIdentifier,
} from '../dto/resourceIdentifier'
import { combine, Result } from 'neverthrow'
import { ResourceIdentifierT } from '../dto/_types'

export const isTransferTokensInput = (
	something: unknown,
): something is TransferTokensInput => {
	const inspection = something as TransferTokensInput
	return (
		isAddressOrUnsafeInput(inspection.to) &&
		isAmountOrUnsafeInput(inspection.amount) &&
		isResourceIdentifierOrUnsafeInput(inspection.tokenIdentifier)
	)
}

export const create = (
	input: TransferTokensInput,
	from: AddressT,
): Result<IntendedTransferTokensAction, Error> => {
	const uuid = uuidv4()

	return combine([
		Address.fromUnsafe(input.to),
		Amount.fromUnsafe(input.amount),
		ResourceIdentifier.fromUnsafe(input.tokenIdentifier),
	]).map(
		(resultList): IntendedTransferTokensAction => {
			const to = resultList[0] as AddressT
			const amount = resultList[1] as AmountT
			const tokenIdentifier = resultList[2] as ResourceIdentifierT

			return {
				to,
				amount,
				tokenIdentifier,
				type: ActionType.TOKEN_TRANSFER,
				from,
				uuid,
			}
		},
	)
}

export const IntendedTransferTokens = {
	create,
}
