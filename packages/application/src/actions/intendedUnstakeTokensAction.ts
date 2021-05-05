import {
	ActionType,
	IntendedStakeTokensAction,
	IntendedUnstakeTokensAction,
	UnstakeTokensInput,
} from './_types'
import { AccountAddressT } from '@radixdlt/account'
import {
	__createIntendedStakeAction,
	isStakeTokensInput,
} from './intendedStakeTokensAction'
import { Result } from 'neverthrow'

export const isUnstakeTokensInput = (
	something: unknown,
): something is UnstakeTokensInput => isStakeTokensInput(something)

const create = (
	input: UnstakeTokensInput,
	from: AccountAddressT,
): Result<IntendedUnstakeTokensAction, Error> =>
	__createIntendedStakeAction(input, from).map(
		(a: IntendedStakeTokensAction) => ({
			...a,
			type: ActionType.UNSTAKE_TOKENS,
		}),
	)

export const IntendedUnstakeTokens = {
	create,
}
