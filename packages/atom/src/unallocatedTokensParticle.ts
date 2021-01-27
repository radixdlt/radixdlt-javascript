import { randomNonce } from '@radixdlt/primitives'
import { tokenPermissionsAll } from './tokenPermissions'
import { ParticleBase, Supply, UnallocatedTokensParticle } from './_types'
import {
	RadixParticleType,
	UnallocatedTokensParticleType,
} from './radixParticleTypes'
import { DSONEncoding, DSONKeyValue } from '@radixdlt/dson'
import {
	encodableKeyValuesFromTokenParticleBase,
	isTokenParticleBase,
	tokenParticleBaseEquals,
	TokensParticleBaseInput,
} from './tokenParticleBase'

export type UnallocatedTokensParticleInput = TokensParticleBaseInput &
	Readonly<{
		amount: Supply
	}>

export const unallocatedTokensParticle = (
	input: UnallocatedTokensParticleInput,
): UnallocatedTokensParticle => {
	const nonce = input.nonce ?? randomNonce()
	const tokenDefinitionReference = input.tokenDefinitionReference
	const granularity = input.granularity
	const amount = input.amount
	const permissions = input.permissions ?? tokenPermissionsAll

	const tokenParticleBase = {
		tokenDefinitionReference,
		granularity,
		nonce,
		amount,
		permissions,
	}

	const dsonKeyValues: DSONKeyValue[] = [
		...encodableKeyValuesFromTokenParticleBase(tokenParticleBase),
		{
			key: 'amount',
			value: amount,
		},
	]

	return {
		...DSONEncoding({
			serializer: 'radix.particles.unallocated_tokens',
			encodingMethodOrKeyValues: dsonKeyValues,
		}),
		radixParticleType: UnallocatedTokensParticleType,
		...tokenParticleBase,
		// eslint-disable-next-line complexity
		equals: (otherParticle: ParticleBase): boolean => {
			if (!isUnallocatedTokensParticle(otherParticle)) return false
			const otherUATP = otherParticle

			return (
				tokenParticleBaseEquals(tokenParticleBase, otherParticle) &&
				otherUATP.amount.equals(amount)
			)
		},
	}
}

// eslint-disable-next-line complexity
export const isUnallocatedTokensParticle = (
	something: unknown,
): something is UnallocatedTokensParticle => {
	if (!isTokenParticleBase(something)) return false
	const inspection = something as UnallocatedTokensParticle
	return (
		inspection.radixParticleType === RadixParticleType.UNALLOCATED_TOKENS &&
		inspection.amount !== undefined &&
		inspection.equals !== undefined
	)
}
