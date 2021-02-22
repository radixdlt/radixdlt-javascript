import { ResourceIdentifierT } from '../_types'
import { nonce } from '@radixdlt/primitives'
import { isRadixParticle, RadixParticleType } from './meta/radixParticleTypes'
import {
	DSONEncoding,
	JSONDecoding,
	JSONEncoding,
	objectDecoder,
	SerializableKeyValues,
} from '@radixdlt/data-formats'
import { ParticleBase, ResourceIdentifierParticleT } from './_types'
import { ok } from 'neverthrow'
import { ResourceIdentifier } from '../resourceIdentifier'

const radixParticleType = RadixParticleType.RESOURCE_IDENTIFIER

const SERIALIZER = 'radix.particles.rri'

const { JSONDecoders, fromJSON } = JSONDecoding(ResourceIdentifier)(
	objectDecoder(SERIALIZER, (input: ResourceIdentifierT) =>
		ok(create(input)),
	),
)
const create = (
	resourceIdentifier: ResourceIdentifierT,
): ResourceIdentifierParticleT => {
	const alwaysZeroNonce = nonce(0)

	const serializeKeyValues: SerializableKeyValues = {
		nonce: alwaysZeroNonce,
		rri: resourceIdentifier,
	}

	return {
		...JSONEncoding(SERIALIZER)(serializeKeyValues),
		...DSONEncoding(SERIALIZER)(serializeKeyValues),

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
): something is ResourceIdentifierParticleT => {
	if (!isRadixParticle(something)) return false
	return something.radixParticleType === radixParticleType
}

export const ResourceIdentifierParticle = {
	create,
	SERIALIZER,
	JSONDecoders,
	fromJSON,
}
