import {
	ParticleBase,
	RadixParticle,
	ResourceIdentifier,
	ResourceIdentifierParticle,
} from './_types'
import { nonce } from '@radixdlt/primitives'
import {
	RadixParticleType,
	ResourceIdentifierParticleType,
} from './radixParticleTypes'

export const resourceIdentifierParticle = (
	resourceIdentifier: ResourceIdentifier,
): ResourceIdentifierParticle => {
	const alwaysZeroNonce = nonce(0)

	return {
		radixParticleType: ResourceIdentifierParticleType,
		alwaysZeroNonce,
		resourceIdentifier,

		hasAllegedType: (
			allegedThis: RadixParticle,
		): ThisType<ResourceIdentifierParticle> | undefined => {
			if (!isResourceIdentifierParticle(allegedThis)) return undefined
			return allegedThis
		},

		equals: (otherParticle: ParticleBase): boolean => {
			if (!isResourceIdentifierParticle(otherParticle)) return false
			const otherRIP = otherParticle
			return (
				otherRIP.alwaysZeroNonce.equals(alwaysZeroNonce) &&
				otherRIP.resourceIdentifier.equals(resourceIdentifier)
			)
		},
	}
}

export const isResourceIdentifierParticle = (
	something: ResourceIdentifierParticle | unknown,
): something is ResourceIdentifierParticle => {
	const inspection = something as ResourceIdentifierParticle
	return (
		inspection.radixParticleType ===
			RadixParticleType.RESOURCE_IDENTIFIER &&
		inspection.alwaysZeroNonce !== undefined &&
		inspection.resourceIdentifier !== undefined
	)
}
