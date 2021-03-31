import {
	ActionType,
	IntendedStakeTokensAction,
	StakeTokensInput,
} from './_types'
import { v4 as uuidv4 } from 'uuid'
import { Address, AddressT } from '@radixdlt/account'
import { isAmount } from '@radixdlt/primitives'

export const isStakeTokensInput = (
	something: unknown,
): something is StakeTokensInput => {
	const inspection = something as StakeTokensInput
	return (
		Address.isAddress(inspection.validator) && isAmount(inspection.amount)
	)
}

const create = (
	input: StakeTokensInput,
	from: AddressT,
): IntendedStakeTokensAction => {
	const uuid = uuidv4()

	return {
		...input,
		type: ActionType.STAKE_TOKENS,
		from,
		uuid,
	}
}

export const IntendedStakeTokens = {
	create,
}
