import {
	ActionType,
	IntendedTransferTokensAction,
	TransferTokensInput,
} from './_types'
import { v4 as uuidv4 } from 'uuid'
import { Address, AddressT } from '@radixdlt/account'
import { isAmount } from '@radixdlt/primitives'
import { isResourceIdentifier } from '../dto/resourceIdentifier'

export const isTransferTokensInput = (
	something: unknown,
): something is TransferTokensInput => {
	const inspection = something as TransferTokensInput
	return (
		Address.isAddress(inspection.to) &&
		isAmount(inspection.amount) &&
		isResourceIdentifier(inspection.tokenIdentifier)
	)
}

const create = (
	input: TransferTokensInput,
	from: AddressT,
): IntendedTransferTokensAction => {
	const uuid = uuidv4()

	return {
		...input,
		type: ActionType.TOKEN_TRANSFER,
		from,
		uuid,
	}
}

export const IntendedTransferTokens = {
	create,
}
