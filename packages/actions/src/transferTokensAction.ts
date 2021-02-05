import {
	TransferTokensAction,
	TransferTokensActionInput,
	UserActionType,
} from './_types'
import { v4 as uuidv4 } from 'uuid'

export const transferTokensAction = (
	input: TransferTokensActionInput,
): TransferTokensAction => {
	const uuid = input.uuid ?? uuidv4()

	return {
		actionType: UserActionType.TOKEN_TRANSFER,
		recipient: input.to,
		sender: input.from,
		resourceIdentifier: input.resourceIdentifier,
		message: input.message,
		amount: input.amount,
		uuid: uuid,
	}
}
