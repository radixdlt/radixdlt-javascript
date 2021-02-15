import { Address } from '@radixdlt/crypto'

import { err, ok, Result } from 'neverthrow'
import { isRadixParticle, RadixParticleType } from './meta/radixParticleTypes'
import {
	DSONCodable,
	DSONEncoding,
	JSONEncodable,
	JSONEncoding,
	JSONObjectDecoder,
} from '@radixdlt/data-formats'
import {
	tokenSerializationKeyValues,
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
export const TTP_SERIALIZER = 'radix.particles.transferrable_tokens'

const DSON = (
	input: TransferrableTokensParticleProps & TokenParticle,
): DSONCodable =>
	DSONEncoding(TTP_SERIALIZER)({
		...tokenSerializationKeyValues(input),
		address: input.address,
	})

const JSON = (
	input: TransferrableTokensParticleProps & TokenParticle,
): JSONEncodable =>
	JSONEncoding(TTP_SERIALIZER)({
		...tokenSerializationKeyValues(input),
		address: input.address,
	})

export const TTPJSONDecoder: JSONObjectDecoder = {
	[TTP_SERIALIZER]: (input: TransferrableTokensParticleInput) =>
		transferrableTokensParticle(input),
}

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
		...JSON(props),
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
