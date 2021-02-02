import { Address } from '@radixdlt/crypto'

import { err, ok, Result } from 'neverthrow'
import { isRadixParticle, RadixParticleType } from './meta/radixParticleTypes'
import { DSONCodable, DSONEncoding } from '@radixdlt/dson'
import {
	tokenDSONKeyValues,
	TokenParticleInput,
	tokenParticleProps,
	withTokenParticleEquals,
} from './meta/tokenParticle'
import { PositiveAmount } from '@radixdlt/primitives'
import {
	TokenParticle,
	TransferrableTokensParticle,
	TransferrableTokensParticleProps,
} from './_types'

export type TransferrableTokensParticleInput = TokenParticleInput &
	Readonly<{
		address: Address
		amount: PositiveAmount
	}>

const radixParticleType = RadixParticleType.TRANSFERRABLE_TOKENS
const SERIALIZER = 'radix.particles.transferrable_tokens'

const DSON = (
	input: TransferrableTokensParticleProps & TokenParticle,
): DSONCodable =>
	DSONEncoding({
		serializer: SERIALIZER,
		encodingMethodOrKeyValues: [
			...tokenDSONKeyValues(input),
			{
				key: 'address',
				value: input.address,
			},
			{
				key: 'amount',
				value: input.amount,
			},
		],
	})

export const transferrableTokensParticle = (
	input: TransferrableTokensParticleInput,
): Result<TransferrableTokensParticle, Error> => {
	if (!input.amount.isMultipleOf(input.granularity)) {
		return err(new Error('Amount not multiple of granularity'))
	}

	const props = {
		...tokenParticleProps(input),
		address: input.address,
		amount: input.amount,
		radixParticleType,
	}

	return ok({
		...DSON(props),

		...withTokenParticleEquals(
			(otherParticle: TransferrableTokensParticle) =>
				otherParticle.address.equals(input.address),
		)(props),

		...props,
	})
}

export const isTransferrableTokensParticle = (
	something: unknown,
): something is TransferrableTokensParticle => {
	if (!isRadixParticle(something)) return false
	return something.radixParticleType === radixParticleType
}
