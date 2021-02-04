import { ResourceIdentifier } from '../_types'
import { nonce } from '@radixdlt/primitives'
import { isRadixParticle, RadixParticleType } from './meta/radixParticleTypes'
import { DSONEncoding, DSONKeyValue } from '@radixdlt/data-formats'
import { ParticleBase, ResourceIdentifierParticle } from './_types'

const radixParticleType = RadixParticleType.RESOURCE_IDENTIFIER

export const resourceIdentifierParticle = (
	resourceIdentifier: ResourceIdentifier,
): ResourceIdentifierParticle => {
	const alwaysZeroNonce = nonce(0)

	const dsonKeyValues: DSONKeyValue[] = [
		{
			key: 'nonce',
			value: alwaysZeroNonce,
		},
		{
			key: 'rri',
			value: resourceIdentifier,
		},
	]

	return {
		...DSONEncoding({
			serializer: 'radix.particles.rri',
			encodingMethodOrKeyValues: dsonKeyValues,
		}),

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
