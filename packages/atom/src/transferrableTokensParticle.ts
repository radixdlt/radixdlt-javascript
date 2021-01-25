import { Address } from '@radixdlt/crypto'
import { TransferrableTokensParticle } from './_types'

import { err, ok, Result } from 'neverthrow'
import { tokenPermissionsAll } from './tokenPermissions'
import { tokenParticle, TokenParticleInput } from './tokenParticle'

type TransferrableTokensParticleInput = TokenParticleInput &
	Readonly<{
		address: Address
	}>

export const transferrableTokensParticle = (
	input: TransferrableTokensParticleInput,
): Result<any, Error> => {
	if (!input.amount.isMultipleOf(input.granularity))
		return err(new Error('Amount not multiple of granularity'))

	return ok(
		tokenParticle({
			...input,
			permissions: input.permissions ?? tokenPermissionsAll,
			equals: (other: TransferrableTokensParticle) =>
				other.address === input.address,
		}),
	)
}
