import {
	amountFromUnsafe,
	AmountInputUnsafe,
	Granularity,
	PositiveAmount,
	positiveAmount,
	randomNonce,
} from '@radixdlt/primitives'

import { Address, addressFromUnsafe } from '@radixdlt/crypto'
import {
	ResourceIdentifier,
	TokenPermissions,
	TransferrableTokensParticle,
} from './_types'
import { resourceIdentifierFromUnsafe } from './_index'

import { Result, err, ok, combine } from 'neverthrow'
import { tokenPermissionsAll } from './tokenPermissions'

export type TTPInput = Readonly<{
	address: Address
	tokenDefinitionReference: ResourceIdentifier
	amount: PositiveAmount
	granularity: Granularity
	permissions?: TokenPermissions
}>

export const transferrableTokensParticleFrom = (
	input: TTPInput,
): Result<TransferrableTokensParticle, Error> => {
	if (!input.amount.isMultipleOf(input.granularity)) {
		return err(new Error('Amount not multiple of granularity'))
	}

	const nonce = randomNonce()

	return ok({
		address: input.address,
		tokenDefinitionReference: input.tokenDefinitionReference,
		granularity: input.granularity,
		nonce,
		amount: input.amount,
		permissions: input.permissions ?? tokenPermissionsAll,
	})
}

export const transferrableTokensParticleFromUnsafe = (
	input: Readonly<{
		address: Address | string
		tokenDefinitionReference: ResourceIdentifier | string
		granularity: Granularity | AmountInputUnsafe
		amount: PositiveAmount | AmountInputUnsafe
		permissions?: TokenPermissions
	}>,
): Result<TransferrableTokensParticle, Error> => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	const address = addressFromUnsafe(input.address)
	const tokenDefinitionReference = resourceIdentifierFromUnsafe(
		input.tokenDefinitionReference,
	)
	const granularity: Result<Granularity, Error> = amountFromUnsafe(
		input.granularity,
	)
	const amount: Result<PositiveAmount, Error> = amountFromUnsafe(
		input.amount,
	).andThen(positiveAmount)

	return combine([address, tokenDefinitionReference, granularity, amount])
		.map(
			(resultList) =>
				<TTPInput>{
					address: resultList[0],
					tokenDefinitionReference: resultList[1],
					granularity: resultList[2],
					amount: resultList[3],
					permissions: input.permissions,
				},
		)
		.andThen(transferrableTokensParticleFrom)
}
