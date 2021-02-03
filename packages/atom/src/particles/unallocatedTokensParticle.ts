import { Supply } from '../_types'
import { isRadixParticle, RadixParticleType } from './meta/radixParticleTypes'
import {
	tokenDSONKeyValues,
	tokenParticleProps,
	TokenParticleInput,
	withTokenParticleEquals,
} from './meta/tokenParticle'
import { DSONCodable, DSONEncoding } from '@radixdlt/dson'
import {
	TokenParticle,
	UnallocatedTokensParticle,
	UnallocatedTokensParticleProps,
} from './_types'

export type UnallocatedTokensParticleInput = TokenParticleInput &
	Readonly<{
		amount: Supply
	}>

const radixParticleType = RadixParticleType.UNALLOCATED_TOKENS
const SERIALIZER = 'radix.particles.unallocated_tokens'

const DSON = (
	input: UnallocatedTokensParticleProps & TokenParticle,
): DSONCodable =>
	DSONEncoding({
		serializer: SERIALIZER,
		encodingMethodOrKeyValues: [
			...tokenDSONKeyValues(input),
			{
				key: 'amount',
				value: input.amount,
			},
		],
	})

export const unallocatedTokensParticle = (
	input: UnallocatedTokensParticleInput,
): UnallocatedTokensParticle => {
	const props = {
		...tokenParticleProps(input),
		amount: input.amount,
		radixParticleType: radixParticleType,
	}

	return {
		...DSON(props),

		...withTokenParticleEquals((otherParticle: UnallocatedTokensParticle) =>
			otherParticle.amount.equals(input.amount),
		)(props),

		...props,
	}
}

export const isUnallocatedTokensParticle = (
	something: unknown,
): something is UnallocatedTokensParticle => {
	if (!isRadixParticle(something)) return false
	return something.radixParticleType === radixParticleType
}
