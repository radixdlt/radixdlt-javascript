import { Granularity, randomNonce } from '@radixdlt/primitives'
import { tokenPermissionsAll } from './tokenPermissions'
import {
	ParticleBase,
	ResourceIdentifier,
	Supply,
	TokenPermissions,
	UnallocatedTokensParticle,
} from './_types'
import {
	RadixParticleType,
	UnallocatedTokensParticleType,
} from './radixParticleTypes'

export type UnallocatedTokensParticleInput = Readonly<{
	tokenDefinitionReference: ResourceIdentifier
	granularity: Granularity
	amount: Supply
	permissions?: TokenPermissions
}>

export const unallocatedTokensParticle = (
	input: UnallocatedTokensParticleInput,
): UnallocatedTokensParticle => {
	const nonce = randomNonce()
	const tokenDefinitionReference = input.tokenDefinitionReference
	const granularity = input.granularity
	const amount = input.amount
	const permissions = input.permissions ?? tokenPermissionsAll

	return {
		radixParticleType: UnallocatedTokensParticleType,
		tokenDefinitionReference,
		granularity,
		nonce,
		amount,
		permissions,
		// eslint-disable-next-line complexity
		equals: (otherParticle: ParticleBase): boolean => {
			if (!isUnallocatedTokensParticle(otherParticle)) return false
			const otherUATP = otherParticle

			return (
				otherUATP.tokenDefinitionReference.equals(
					tokenDefinitionReference,
				) &&
				otherUATP.granularity.equals(granularity) &&
				otherUATP.nonce.equals(nonce) &&
				otherUATP.amount.equals(amount) &&
				otherUATP.permissions.equals(permissions)
			)
		},
	}
}

// eslint-disable-next-line complexity
export const isUnallocatedTokensParticle = (
	something: unknown,
): something is UnallocatedTokensParticle => {
	const inspection = something as UnallocatedTokensParticle
	return (
		inspection.radixParticleType === RadixParticleType.UNALLOCATED_TOKENS &&
		inspection.tokenDefinitionReference !== undefined &&
		inspection.granularity !== undefined &&
		inspection.nonce !== undefined &&
		inspection.amount !== undefined &&
		inspection.permissions !== undefined &&
		inspection.equals !== undefined
	)
}
