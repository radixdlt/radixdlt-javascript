import { Action, ActionType, Unstake, UnstakeTokensInput } from './_types'
import {
	AccountAddressT,
	isResourceIdentifierOrUnsafeInput,
	isValidatorAddressOrUnsafeInput,
	ResourceIdentifier,
	ResourceIdentifierT,
	ValidatorAddress,
	ValidatorAddressT,
	AccountAddress,
} from '@account'
import { combineWithAllErrors, Result } from 'neverthrow'
import { Amount, AmountT, isAmountOrUnsafeInput } from '@primitives'
import { PrimitiveFrom } from '../_types'

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
	input: Omit<PrimitiveFrom<Unstake>, 'type'>,
): Result<Unstake, Error[]> =>
	combineWithAllErrors([
		ValidatorAddress.fromUnsafe(input.from_validator),
		Amount.fromUnsafe(input.amount),
		AccountAddress.fromUnsafe(input.to_account),
		ResourceIdentifier.fromUnsafe(input.rri),
	]).map(results => ({
		from_validator: results[0] as ValidatorAddressT,
		amount: results[1] as AmountT,
		to_account: results[2] as AccountAddressT,
		rri: results[3] as ResourceIdentifierT,
		type: ActionType.UNSTAKE,
	}))

const toPrimitive = (action: Unstake) => ({
	type: ActionType.UNSTAKE,
	from_validator: {
		address: action.from_validator.toPrimitive(),
	},
	to_account: {
		address: action.to_account.toPrimitive(),
	},
	amount: {
		value: action.amount.toPrimitive(),
		token_identifier: {
			rri: action.rri.toPrimitive(),
		},
	},
})

export const IntendedUnstakeTokens = {
	create,
	toPrimitive,
}
