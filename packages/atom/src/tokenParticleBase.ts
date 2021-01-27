import { DSONKeyValue } from '@radixdlt/dson'
import { Granularity, Nonce } from '@radixdlt/primitives'
import {
	ParticleBase,
	ResourceIdentifier,
	TokenPermissions,
	TokensParticleBase,
} from './_types'

export const encodableKeyValuesFromTokenParticleBase = <
	B extends TokensParticleBase
>(
	base: B,
): DSONKeyValue[] => {
	return [
		{
			key: 'tokenDefinitionReference',
			value: base.tokenDefinitionReference,
		},
		{
			key: 'granularity',
			value: base.granularity,
		},
		{
			key: 'nonce',
			value: base.nonce,
		},
		{
			key: 'permissions',
			value: base.permissions,
		},
	]
}

/* eslint-disable max-params */
// eslint-disable-next-line complexity
export const tokenParticleBaseEquals = (
	base: TokensParticleBase,
	otherParticle: ParticleBase,
): boolean => {
	/* eslint-enable max-params */
	if (!isTokenParticleBase(otherParticle)) return false
	return (
		otherParticle.tokenDefinitionReference.equals(
			base.tokenDefinitionReference,
		) &&
		otherParticle.granularity.equals(base.granularity) &&
		otherParticle.nonce.equals(base.nonce) &&
		otherParticle.permissions.equals(base.permissions)
	)
}

export type TokensParticleBaseInput = Readonly<{
	tokenDefinitionReference: ResourceIdentifier
	granularity: Granularity
	permissions?: TokenPermissions
	nonce?: Nonce // Only used for testing
}>

export const isTokenParticleBase = (
	something: unknown,
): something is TokensParticleBase => {
	const inspection = something as TokensParticleBase
	return (
		inspection.tokenDefinitionReference !== undefined &&
		inspection.granularity !== undefined &&
		inspection.nonce !== undefined &&
		inspection.permissions !== undefined
	)
}
