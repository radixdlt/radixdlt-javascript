import { AddressT, Address } from '@radixdlt/crypto'

import { err, ok, Result } from 'neverthrow'
import { isRadixParticle, RadixParticleType } from './meta/radixParticleTypes'
import {
	Decoder,
	DSONCodable,
	DSONEncoding,
	JSONDecoding,
	JSONDecodablePrimitive,
	JSONEncodable,
	JSONEncoding,
	JSONObjectDecoder,
	objectDecoder,
} from '@radixdlt/data-formats'
import {
	tokenSerializationKeyValues,
	TokenParticleInput,
	tokenParticleProps,
	withTokenParticleEquals,
} from './meta/tokenParticle'
import {
	TokenParticle,
	TransferrableTokensParticleT,
	TransferrableTokensParticleProps,
} from './_types'
import { Amount } from '@radixdlt/primitives'
import { ResourceIdentifier } from '../resourceIdentifier'

export type TransferrableTokensParticleInput = TokenParticleInput &
	Readonly<{
		address: AddressT
	}>

const radixParticleType = RadixParticleType.TRANSFERRABLE_TOKENS
const SERIALIZER = 'radix.particles.transferrable_tokens'

const DSON = (
	input: TransferrableTokensParticleProps & TokenParticle,
): DSONCodable =>
	DSONEncoding(SERIALIZER)({
		...tokenSerializationKeyValues(input),
		address: input.address,
	})

const JSON = (
	input: TransferrableTokensParticleProps & TokenParticle,
): JSONEncodable =>
	JSONEncoding(SERIALIZER)({
		...tokenSerializationKeyValues(input),
		address: input.address,
	})

const { JSONDecoders, fromJSON } = JSONDecoding<TransferrableTokensParticleT>(
	Address,
	Amount,
	ResourceIdentifier,
)(
	objectDecoder(SERIALIZER, (input: TransferrableTokensParticleInput) =>
		create(input),
	),
)

const create = (
	input: TransferrableTokensParticleInput,
): Result<TransferrableTokensParticleT, Error> => {
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
			(otherParticle: TransferrableTokensParticleT) =>
				otherParticle.address.equals(input.address),
		)(props),

		...props,
	})
}

export const isTransferrableTokensParticle = (
	something: unknown,
): something is TransferrableTokensParticleT => {
	if (!isRadixParticle(something)) return false
	return something.radixParticleType === radixParticleType
}

export const TransferrableTokensParticle = {
	SERIALIZER,
	fromJSON,
	JSONDecoders,
	create,
}
