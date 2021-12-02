import { Action, ActionType, Stake, StakeTokensInput } from './_types'
import {
	AccountAddressT,
	isValidatorAddressOrUnsafeInput,
	ValidatorAddress,
	ValidatorAddressT,
	ResourceIdentifier,
	ResourceIdentifierT,
	isResourceIdentifierOrUnsafeInput,
	AccountAddress,
} from '@account'
import { Amount, AmountT, isAmountOrUnsafeInput } from '@primitives'
import { combineWithAllErrors, Result } from 'neverthrow'
import { PrimitiveFrom } from '../_types'

export const isStakeTokensInput = (
	something: unknown,
): something is StakeTokensInput => {
	const inspection = something as StakeTokensInput
	return (
		isValidatorAddressOrUnsafeInput(inspection.to_validator) &&
		isAmountOrUnsafeInput(inspection.amount) &&
		isResourceIdentifierOrUnsafeInput(inspection.tokenIdentifier)
	)
}

type PrimitiveStake = PrimitiveFrom<Stake>

const create = (input: Omit<PrimitiveStake, 'type'>): Result<Stake, Error[]> =>
	combineWithAllErrors([
		ValidatorAddress.fromUnsafe(input.to_validator),
		Amount.fromUnsafe(input.amount),
		AccountAddress.fromUnsafe(input.from_account),
		ResourceIdentifier.fromUnsafe(input.rri),
	]).map(results => ({
		to_validator: results[0] as ValidatorAddressT,
		amount: results[1] as AmountT,
		from_account: results[2] as AccountAddressT,
		rri: results[3] as ResourceIdentifierT,
		type: ActionType.STAKE,
	}))

const toPrimitive = (action: Stake) => ({
	type: ActionType.STAKE,
	from_account: {
		address: action.from_account.toPrimitive(),
	},
	to_validator: {
		address: action.to_validator.toPrimitive(),
	},
	amount: {
		value: action.amount.toPrimitive(),
		token_identifier: {
			rri: action.rri.toPrimitive(),
		},
	},
})

export const IntendedStakeTokens = {
	create,
	toPrimitive,
}
