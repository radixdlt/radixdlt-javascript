import {
	BurnTokensAction,
	BurnTokensActionInput,
	UserActionType,
} from './_types'
import { v4 as uuidv4 } from 'uuid'

export const burnTokensAction = (
	input: BurnTokensActionInput,
): BurnTokensAction => {
	const uuid = input.uuid ?? uuidv4()

	return {
		actionType: UserActionType.BURN_TOKENS,
		sender: input.burner,
		tokenResourceIdentifier: input.resourceIdentifier,
		amount: input.amount,
		uuid: uuid,
	}
}
