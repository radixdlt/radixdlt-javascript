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
	JSONDecoding,
	JSONEncodable,
	JSONEncoding,
	objectDecoder,
} from '@radixdlt/data-formats'
import { TokenParticle, UnallocatedTokensParticleT } from './_types'
import { ok } from 'neverthrow'
import { Amount } from '@radixdlt/primitives'
import { ResourceIdentifier } from '../resourceIdentifier'

const radixParticleType = RadixParticleType.UNALLOCATED_TOKENS
const SERIALIZER = 'radix.particles.unallocated_tokens'

const JSON = (input: TokenParticle): JSONEncodable =>
	JSONEncoding(SERIALIZER)({ ...tokenSerializationKeyValues(input) })

const DSON = (input: TokenParticle): DSONCodable =>
	DSONEncoding(SERIALIZER)({ ...tokenSerializationKeyValues(input) })

const { fromJSON, JSONDecoders } = JSONDecoding<UnallocatedTokensParticleT>(
	Amount,
	ResourceIdentifier,
)(
	objectDecoder(SERIALIZER, (input: TokenParticleInput) =>
		ok(unallocatedTokensParticle(input)),
	),
)

export const unallocatedTokensParticle = (
	input: TokenParticleInput,
): UnallocatedTokensParticleT => {
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
): something is UnallocatedTokensParticleT => {
	if (!isRadixParticle(something)) return false
	return something.radixParticleType === radixParticleType
}

export const UnallocatedTokensParticle = {
	fromJSON,
	JSONDecoders,
	SERIALIZER,
}
