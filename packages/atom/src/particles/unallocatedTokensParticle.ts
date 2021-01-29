import { Granularity } from '@radixdlt/primitives'
import { ResourceIdentifier, Supply, TokenPermissions } from '../_types'
import {
	RadixParticleType,
	UnallocatedTokensParticleType,
} from './meta/radixParticleTypes'
import {
	tokenDSONKeyValues,
	tokenParticleProps,
	withTokenParticleEquals,
} from './meta/tokenParticle'
import { DSONCodable, DSONEncoding } from '@radixdlt/dson'
import {
	TokenParticle,
	UnallocatedTokensParticle,
	UnallocatedTokensParticleProps,
} from './_types'

export type UnallocatedTokensParticleInput = Readonly<{
	tokenDefinitionReference: ResourceIdentifier
	granularity: Granularity
	amount: Supply
	permissions?: TokenPermissions
}>

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
		radixParticleType: UnallocatedTokensParticleType,
	}

	return {
		...DSON(props),

		...withTokenParticleEquals((otherParticle: UnallocatedTokensParticle) =>
			otherParticle.amount.equals(input.amount),
		)(props),

		...props,
	}
}

// eslint-disable-next-line complexity
export const isUnallocatedTokensParticle = (
	something: unknown,
): something is UnallocatedTokensParticle => {
	const inspection = something as UnallocatedTokensParticle
	return (
		inspection.radixParticleType === RadixParticleType.UNALLOCATED_TOKENS &&
		inspection.tokenDefinitionReference !== undefined &&
		inspection.granularity !== undefined &&
		inspection.nonce !== undefined &&
		inspection.amount !== undefined &&
		inspection.permissions !== undefined &&
		inspection.equals !== undefined
	)
}
