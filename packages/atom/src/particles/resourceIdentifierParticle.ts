import { ResourceIdentifier } from '../_types'
import { nonce } from '@radixdlt/primitives'
import { isRadixParticle, RadixParticleType } from './meta/radixParticleTypes'
import {
	DSONEncoding,
	JSONEncoding,
	JSONObjectDecoder,
	SerializableKeyValues,
} from '@radixdlt/data-formats'
import { ParticleBase, ResourceIdentifierParticle } from './_types'
import { ok } from 'neverthrow'

const radixParticleType = RadixParticleType.RESOURCE_IDENTIFIER

export const RRI_SERIALIZER = 'radix.particles.rri'

export const RRIParticleJSONDecoder: JSONObjectDecoder = {
	[RRI_SERIALIZER]: (input: ResourceIdentifier) =>
		ok(resourceIdentifierParticle(input)),
}

export const resourceIdentifierParticle = (
	resourceIdentifier: ResourceIdentifier,
): ResourceIdentifierParticle => {
	const alwaysZeroNonce = nonce(0)

	const serializeKeyValues: SerializableKeyValues = {
		nonce: alwaysZeroNonce,
		rri: resourceIdentifier,
	}

	return {
		...JSONEncoding(RRI_SERIALIZER)(serializeKeyValues),
		...DSONEncoding(RRI_SERIALIZER)(serializeKeyValues),

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
