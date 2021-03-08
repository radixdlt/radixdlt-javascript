import { ResourceIdentifierT, SERIALIZER_KEY } from '../_types'
import { nonce } from '@radixdlt/primitives'
import { isRadixParticle, RadixParticleType } from './meta/radixParticleTypes'
import {
	DSONEncoding,
	JSONEncoding,
	SerializableKeyValues,
	taggedObjectDecoder,
} from '@radixdlt/data-formats'
import { ParticleBase, ResourceIdentifierParticleT } from './_types'
import { ok } from 'neverthrow'
import { ResourceIdentifier } from '../resourceIdentifier'
import { JSONDecoding } from '../utils'

const radixParticleType = RadixParticleType.RESOURCE_IDENTIFIER

const SERIALIZER = 'radix.particles.rri'

const JSONDecoder = taggedObjectDecoder(
	SERIALIZER,
	SERIALIZER_KEY,
)((input: ResourceIdentifierT) => ok(create(input)))

const jsonDecoding = JSONDecoding.withDependencies(ResourceIdentifier)
	.withDecoders(JSONDecoder)
	.create<ResourceIdentifierParticleT>()

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
	...jsonDecoding,
}
