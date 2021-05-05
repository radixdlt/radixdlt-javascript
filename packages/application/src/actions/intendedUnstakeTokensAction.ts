import {
	ActionType,
	IntendedStakeTokensAction,
	IntendedUnstakeTokensAction,
	UnstakeTokensInput,
} from './_types'
import { Acc0untAddressT } from '@radixdlt/account'
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
	from: Acc0untAddressT,
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
