import { isRadixParticle, RadixParticleType } from './meta/radixParticleTypes'
import {
	tokenSerializationKeyValues,
	tokenParticleProps,
	TokenParticleInput,
	withTokenParticleEquals,
} from './meta/tokenParticle'
import {
	DSONCodable,
	DSONEncoding,
	JSONEncodable,
	JSONEncoding,
	taggedObjectDecoder,
} from '@radixdlt/data-formats'
import { TokenParticle, UnallocatedTokensParticleT } from './_types'
import { ok } from 'neverthrow'
import { Amount } from '@radixdlt/primitives'
import { ResourceIdentifier } from '../resourceIdentifier'
import { SERIALIZER_KEY } from '../_types'
import { JSONDecoding } from '../utils'

const radixParticleType = RadixParticleType.UNALLOCATED_TOKENS
const SERIALIZER = 'radix.particles.unallocated_tokens'

const serialization = (input: TokenParticle): JSONEncodable & DSONCodable => {
	const keyValues = tokenSerializationKeyValues(input)

	return {
		...JSONEncoding(SERIALIZER)({ ...keyValues }),
		...DSONEncoding(SERIALIZER)({ ...keyValues }),
	}
}

const JSONDecoder = taggedObjectDecoder(
	SERIALIZER,
	SERIALIZER_KEY,
)((input: TokenParticleInput) => ok(unallocatedTokensParticle(input)))

const jsonDecoding = JSONDecoding.withDependencies(Amount, ResourceIdentifier)
	.withDecoders(JSONDecoder)
	.create<UnallocatedTokensParticleT>()

export const unallocatedTokensParticle = (
	input: TokenParticleInput,
): UnallocatedTokensParticleT => {
	const props = {
		...tokenParticleProps(input),
		radixParticleType: radixParticleType,
	}

	return {
		...serialization(props),

		...withTokenParticleEquals()(props),

		...props,
	}
}

export const isUnallocatedTokensParticle = (
	something: unknown,
): something is UnallocatedTokensParticleT => {
	if (!isRadixParticle(something)) return false
	return something.radixParticleType === radixParticleType
}

export const UnallocatedTokensParticle = {
	...jsonDecoding,
	JSONDecoder,
	SERIALIZER,
}
