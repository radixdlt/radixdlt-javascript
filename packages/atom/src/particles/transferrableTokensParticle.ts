import { Address } from '@radixdlt/account'

import { err, ok, Result } from 'neverthrow'
import { isRadixParticle, RadixParticleType } from './meta/radixParticleTypes'
import { DSONCodable, DSONEncoding } from '@radixdlt/data-formats'
import {
	tokenDSONKeyValues,
	TokenParticleInput,
	tokenParticleProps,
	withTokenParticleEquals,
} from './meta/tokenParticle'
import {
	TokenParticle,
	TransferrableTokensParticle,
	TransferrableTokensParticleProps,
} from './_types'

export type TransferrableTokensParticleInput = TokenParticleInput &
	Readonly<{
		address: Address
	}>

const radixParticleType = RadixParticleType.TRANSFERRABLE_TOKENS
const SERIALIZER = 'radix.particles.transferrable_tokens'

const DSON = (
	input: TransferrableTokensParticleProps & TokenParticle,
): DSONCodable =>
	DSONEncoding(SERIALIZER)({
		...tokenDSONKeyValues(input),
		address: input.address,
	})

export const transferrableTokensParticle = (
	input: TransferrableTokensParticleInput,
): Result<TransferrableTokensParticle, Error> => {
	const props = {
		...tokenParticleProps(input),
		address: input.address,
		radixParticleType,
	}

	if (!props.amount.isMultipleOf(props.granularity)) {
		return err(new Error('Amount not multiple of granularity'))
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
