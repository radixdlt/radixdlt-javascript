import { isSomeEnum } from '@radixdlt/util'
import { RadixParticle } from '../_types'

export enum RadixParticleType {
	TRANSFERRABLE_TOKENS = 'TransferrableTokensParticle',
	UNALLOCATED_TOKENS = 'UnallocatedTokensParticle',
	RESOURCE_IDENTIFIER = 'ResourceIdentifierParticle',
	FIXED_SUPPLY_TOKEN_DEFINITION = 'FixedSupplyTokenDefintionParticle',
	MUTABLE_SUPPLY_TOKEN_DEFINITION = 'MutableSupplyTokenDefintionParticle',
}
export const TransferrableTokensParticleType =
	RadixParticleType.TRANSFERRABLE_TOKENS
export const UnallocatedTokensParticleType =
	RadixParticleType.UNALLOCATED_TOKENS
export const ResourceIdentifierParticleType =
	RadixParticleType.RESOURCE_IDENTIFIER

export const isRadixParticle = (
	something: unknown,
): something is RadixParticle => {
	const inspection = something as RadixParticle
	if (inspection.radixParticleType === undefined) return false
	const radixParticleType = inspection.radixParticleType
	return isRadixParticleType(radixParticleType)
}

export const isRadixParticleType = (
	something: unknown,
): something is RadixParticleType => {
	return isSomeEnum(RadixParticleType)(something)
}
