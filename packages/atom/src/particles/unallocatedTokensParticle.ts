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
} from '@radixdlt/data-formats'
import { TokenParticle, UnallocatedTokensParticle } from './_types'

const radixParticleType = RadixParticleType.UNALLOCATED_TOKENS
const SERIALIZER = 'radix.particles.unallocated_tokens'

const JSON = (input: TokenParticle): JSONEncodable =>
	JSONEncoding(SERIALIZER)({ ...tokenSerializationKeyValues(input) })

const DSON = (input: TokenParticle): DSONCodable =>
	DSONEncoding(SERIALIZER)({ ...tokenSerializationKeyValues(input) })

export const unallocatedTokensParticle = (
	input: TokenParticleInput,
): UnallocatedTokensParticle => {
	const props = {
		...tokenParticleProps(input),
		radixParticleType: radixParticleType,
	}

	return {
		...JSON(props),
		...DSON(props),

		...withTokenParticleEquals()(props),

		...props,
	}
}

export const isUnallocatedTokensParticle = (
	something: unknown,
): something is UnallocatedTokensParticle => {
	if (!isRadixParticle(something)) return false
	return something.radixParticleType === radixParticleType
}
