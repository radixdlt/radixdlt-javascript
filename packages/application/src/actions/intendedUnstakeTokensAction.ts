import {
	ActionType,
	IntendedUnstakeTokensAction,
	UnstakeTokensInput,
} from './_types'
import {
	AccountAddressT,
	isResourceIdentifierOrUnsafeInput,
	isValidatorAddressOrUnsafeInput,
	ResourceIdentifier,
	ResourceIdentifierT,
	ValidatorAddress,
	ValidatorAddressT,
} from '@radixdlt/account'
import { combine, Result } from 'neverthrow'
import { Amount, AmountT, isAmountOrUnsafeInput } from '@radixdlt/primitives'

export const isUnstakeTokensInput = (
	something: unknown,
): something is UnstakeTokensInput => {
	const inspection = something as UnstakeTokensInput
	return (
		isValidatorAddressOrUnsafeInput(inspection.from_validator) &&
		isAmountOrUnsafeInput(inspection.amount) &&
		isResourceIdentifierOrUnsafeInput(inspection.tokenIdentifier)
	)
}

const create = (
	input: UnstakeTokensInput,
	to_account: AccountAddressT,
): Result<IntendedUnstakeTokensAction, Error> =>
	combine([
		ValidatorAddress.fromUnsafe(input.from_validator),
		Amount.fromUnsafe(input.amount),
		ResourceIdentifier.fromUnsafe(input.tokenIdentifier),
	]).map((resultList): IntendedUnstakeTokensAction => {
		const from_validator = resultList[0] as ValidatorAddressT
		const amount = resultList[1] as AmountT
		const rri = resultList[2] as ResourceIdentifierT

		return {
			from_validator,
			amount,
			type: ActionType.UNSTAKE_TOKENS,
			to_account,
			rri,
		}
	})

export const IntendedUnstakeTokens = {
	create,
}
