import {
	TransferTokensAction,
	TransferTokensActionInput,
	UserActionType,
} from './_types'
import { v4 as uuidv4 } from 'uuid'
import { one } from '@radixdlt/primitives'
import { Result, err, ok } from 'neverthrow'

export const transferTokensAction = (
	input: TransferTokensActionInput,
): Result<TransferTokensAction, Error> => {
	if (input.amount.lessThan(one))
		return err(new Error('Cannot transfer a non positve amount.'))

	const uuid = input.uuid ?? uuidv4()

	return ok({
		actionType: UserActionType.TOKEN_TRANSFER,
		recipient: input.to,
		sender: input.from,
		tokenResourceIdentifier: input.resourceIdentifier,
		message: input.message,
		amount: input.amount,
		uuid: uuid,
	})
}
