import { ResourceIdentifier } from '../_types'
import { nonce } from '@radixdlt/primitives'
import { isRadixParticle, RadixParticleType } from './meta/radixParticleTypes'
import {
	DSONEncoding,
	DSONKeyValues,
	JSONEncoding,
} from '@radixdlt/data-formats'
import { ParticleBase, ResourceIdentifierParticle } from './_types'

const radixParticleType = RadixParticleType.RESOURCE_IDENTIFIER

const SERIALIZER = 'radix.particles.rri'

export const resourceIdentifierParticle = (
	resourceIdentifier: ResourceIdentifier,
): ResourceIdentifierParticle => {
	const alwaysZeroNonce = nonce(0)

	const dsonKeyValues: DSONKeyValues = {
		nonce: alwaysZeroNonce,
		rri: resourceIdentifier,
	}

	return {
		...JSONEncoding(SERIALIZER)({}),
		...DSONEncoding(SERIALIZER)(dsonKeyValues),

		radixParticleType,
		alwaysZeroNonce,
		resourceIdentifier,

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
	something: unknown,
): something is ResourceIdentifierParticle => {
	if (!isRadixParticle(something)) return false
	return something.radixParticleType === radixParticleType
}
