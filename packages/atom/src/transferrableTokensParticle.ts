import { Granularity, PositiveAmount, randomNonce } from '@radixdlt/primitives'

import { Address } from '@radixdlt/crypto'
import {
	ParticleType,
	ResourceIdentifier,
	TokenPermissions,
	TransferrableTokensParticle,
} from './_types'

import { Result, err, ok } from 'neverthrow'
import { tokenPermissionsAll } from './tokenPermissions'

export type TransferrableTokensParticleInput = Readonly<{
	address: Address
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

	const address = input.address
	const tokenDefinitionReference = input.tokenDefinitionReference
	const granularity = input.granularity
	const amount = input.amount
	const permissions = input.permissions ?? tokenPermissionsAll

	return ok({
		particleType: 'TransferrableTokensParticle',
		address,
		tokenDefinitionReference,
		granularity,
		nonce,
		amount,
		permissions,
		// eslint-disable-next-line complexity
		equals: (otherParticle: ParticleType): boolean => {
			if (!isTransferrableTokensParticle(otherParticle)) return false
			const otherTTP = otherParticle

			return (
				otherTTP.address.equals(address) &&
				otherTTP.tokenDefinitionReference.equals(
					tokenDefinitionReference,
				) &&
				otherTTP.granularity.equals(granularity) &&
				otherTTP.nonce.equals(nonce) &&
				otherTTP.amount.equals(amount) &&
				otherTTP.permissions.equals(permissions)
			)
		},
	})
}
// eslint-disable-next-line complexity
export const isTransferrableTokensParticle = (
	something: TransferrableTokensParticle | unknown,
): something is TransferrableTokensParticle => {
	const inspection = something as TransferrableTokensParticle
	return (
		inspection.particleType === 'TransferrableTokensParticle' &&
		inspection.address !== undefined &&
		inspection.tokenDefinitionReference !== undefined &&
		inspection.granularity !== undefined &&
		inspection.nonce !== undefined &&
		inspection.amount !== undefined &&
		inspection.permissions !== undefined &&
		inspection.equals !== undefined
	)
}
