import {
	ActionType,
	IntendedUnstakeTokensAction,
	UnstakeTokensInput,
} from './_types'
import { v4 as uuidv4 } from 'uuid'
import { Address, AddressT } from '@radixdlt/account'
import { isAmount } from '@radixdlt/primitives'

export const isUnstakeTokensInput = (
	something: unknown,
): something is UnstakeTokensInput => {
	const inspection = something as UnstakeTokensInput
	return (
		Address.isAddress(inspection.validator) && isAmount(inspection.amount)
	)
}

const create = (
	input: UnstakeTokensInput,
	from: AddressT,
): IntendedUnstakeTokensAction => {
	const uuid = uuidv4()

	return {
		...input,
		type: ActionType.UNSTAKE_TOKENS,
		uuid,
		from,
	}
}

export const IntendedUnstakeTokens = {
	create,
}
