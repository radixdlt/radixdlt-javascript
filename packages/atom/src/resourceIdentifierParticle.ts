import {
	ParticleType,
	ResourceIdentifier,
	ResourceIdentifierParticle,
} from './_types'
import { nonce } from '@radixdlt/primitives'

export const resourceIdentifierParticle = (
	resourceIdentifier: ResourceIdentifier,
): ResourceIdentifierParticle => {
	const alwaysZeroNonce = nonce(0)

	return {
		particleType: 'ResourceIdentifierParticle',
		alwaysZeroNonce,
		resourceIdentifier,
		equals: (otherParticle: ParticleType): boolean => {
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
		inspection.particleType === 'ResourceIdentifierParticle' &&
		inspection.alwaysZeroNonce !== undefined &&
		inspection.resourceIdentifier !== undefined
	)
}
