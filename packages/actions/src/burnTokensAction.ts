import {
	BurnTokensAction,
	BurnTokensActionInput,
	UserActionType,
} from './_types'
import { v4 as uuidv4 } from 'uuid'
import { one } from '@radixdlt/primitives'
import { Result, err, ok } from 'neverthrow'

export const burnTokensAction = (
	input: BurnTokensActionInput,
): Result<BurnTokensAction, Error> => {
	if (input.amount.lessThan(one))
		return err(new Error('Cannot burn a non positve amount.'))

	const uuid = input.uuid ?? uuidv4()

	return ok({
		actionType: UserActionType.BURN_TOKENS,
		sender: input.burner,
		tokenResourceIdentifier: input.resourceIdentifier,
		amount: input.amount,
		uuid: uuid,
	})
}
