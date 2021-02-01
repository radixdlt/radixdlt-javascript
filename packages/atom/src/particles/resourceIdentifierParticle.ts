import { ResourceIdentifier } from '../_types'
import { nonce } from '@radixdlt/primitives'
import {
	RadixParticleType,
	ResourceIdentifierParticleType,
} from './meta/radixParticleTypes'
import { DSONEncoding, DSONKeyValue } from '@radixdlt/dson'
import { ParticleBase, ResourceIdentifierParticle } from './_types'

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

		radixParticleType: ResourceIdentifierParticleType,
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
