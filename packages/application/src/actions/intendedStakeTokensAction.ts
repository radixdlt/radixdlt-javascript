import {
	ActionType,
	IntendedStakeTokensAction,
	StakeTokensInput,
} from './_types'
import {
	Acc0untAddressT,
	isValidatorAddressOrUnsafeInput,
	ValidatorAddress,
	ValidatorAddressT,
} from '@radixdlt/account'
import { Amount, AmountT, isAmountOrUnsafeInput } from '@radixdlt/primitives'
import { combine, Result } from 'neverthrow'

export const isStakeTokensInput = (
	something: unknown,
): something is StakeTokensInput => {
	const inspection = something as StakeTokensInput
	return (
		isValidatorAddressOrUnsafeInput(inspection.validator) &&
		isAmountOrUnsafeInput(inspection.amount)
	)
}

export const __createIntendedStakeAction = (
	input: StakeTokensInput,
	from: Acc0untAddressT,
): Result<IntendedStakeTokensAction, Error> => {
	return combine([
		ValidatorAddress.fromUnsafe(input.validator),
		Amount.fromUnsafe(input.amount),
	]).map(
		(resultList): IntendedStakeTokensAction => {
			const validator = resultList[0] as ValidatorAddressT
			const amount = resultList[1] as AmountT

			return {
				validator,
				amount,
				type: ActionType.STAKE_TOKENS,
				from,
			}
		},
	)
}

export const IntendedStakeTokens = {
	create: __createIntendedStakeAction,
}
