import {
	Granularity,
	Nonce,
	PositiveAmount,
	randomNonce,
} from '@radixdlt/primitives'

import { Address } from '@radixdlt/crypto'
import {
	ParticleBase,
	ResourceIdentifier,
	TokenPermissions,
	TransferrableTokensParticle,
} from './_types'

import { err, ok, Result } from 'neverthrow'
import { tokenPermissionsAll } from './tokenPermissions'
import {
	RadixParticleType,
	TransferrableTokensParticleType,
} from './radixParticleTypes'
import { DSONEncoding, DSONKeyValue, DSONPrimitive } from '@radixdlt/dson'

export type TransferrableTokensParticleInput = Readonly<{
	address: Address
	tokenDefinitionReference: ResourceIdentifier
	amount: PositiveAmount
	granularity: Granularity
	permissions?: TokenPermissions
	nonce?: Nonce // Only used for testing
}>

export const transferrableTokensParticle = (
	input: TransferrableTokensParticleInput,
): Result<TransferrableTokensParticle, Error> => {
	if (!input.amount.isMultipleOf(input.granularity)) {
		return err(new Error('Amount not multiple of granularity'))
	}

	const nonce = input.nonce ?? randomNonce()
	const address = input.address
	const tokenDefinitionReference = input.tokenDefinitionReference
	const granularity = input.granularity
	const amount = input.amount
	const permissions = input.permissions ?? tokenPermissionsAll

	const dsonKeyValues: DSONKeyValue[] = [
		{
			key: 'address',
			value: address,
		},
		{
			key: 'tokenDefinitionReference',
			value: tokenDefinitionReference,
		},
		{
			key: 'granularity',
			value: granularity,
		},
		{
			key: 'amount',
			value: amount,
		},
		{
			key: 'nonce',
			value: nonce,
		},
		{
			key: 'permissions',
			value: permissions,
		},
	]

	return ok({
		...DSONEncoding({
			serializer: 'radix.particles.transferrable_tokens',
			encodingMethodOrKeyValues: dsonKeyValues,
		}),
		radixParticleType: TransferrableTokensParticleType,
		address,
		tokenDefinitionReference,
		granularity,
		nonce,
		amount,
		permissions,
		// eslint-disable-next-line complexity
		equals: (otherParticle: ParticleBase): boolean => {
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
	something: unknown,
): something is TransferrableTokensParticle => {
	const inspection = something as TransferrableTokensParticle
	return (
		inspection.radixParticleType ===
			RadixParticleType.TRANSFERRABLE_TOKENS &&
		inspection.address !== undefined &&
		inspection.tokenDefinitionReference !== undefined &&
		inspection.granularity !== undefined &&
		inspection.nonce !== undefined &&
		inspection.amount !== undefined &&
		inspection.permissions !== undefined &&
		inspection.equals !== undefined
	)
}
