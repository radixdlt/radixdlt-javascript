import { Granularity, PositiveAmount, randomNonce } from '@radixdlt/primitives'

import { AddressLike } from '@radixdlt/crypto'
import {
	ResourceIdentifier,
	TokenPermissions,
	TransferrableTokensParticle,
} from './_types'

import { Result, err, ok } from 'neverthrow'
import { tokenPermissionsAll } from './tokenPermissions'

export type TransferrableTokensParticleInput = Readonly<{
	address: AddressLike
	tokenDefinitionReference: ResourceIdentifier
	amount: PositiveAmount
	granularity: Granularity
	permissions?: TokenPermissions
}>

export const transferrableTokensParticle = (
	input: TransferrableTokensParticleInput,
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
