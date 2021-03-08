import { AddressT, Address } from '@radixdlt/account'

import { err, ok, Result } from 'neverthrow'
import { isRadixParticle, RadixParticleType } from './meta/radixParticleTypes'
import {
	DSONCodable,
	DSONEncoding,
	JSONEncodable,
	JSONEncoding,
	taggedObjectDecoder,
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
import { SERIALIZER_KEY } from '../_types'
import { JSONDecoding } from '../utils'

export type TransferrableTokensParticleInput = TokenParticleInput &
	Readonly<{
		address: AddressT
	}>

const radixParticleType = RadixParticleType.TRANSFERRABLE_TOKENS
const SERIALIZER = 'radix.particles.transferrable_tokens'

const serialization = (
	input: TransferrableTokensParticleProps & TokenParticle,
): JSONEncodable & DSONCodable => {
	const keyValues = {
		...tokenSerializationKeyValues(input),
		address: input.address,
	}

	return {
		...JSONEncoding(SERIALIZER)(keyValues),
		...DSONEncoding(SERIALIZER)(keyValues),
	}
}

const JSONDecoder = taggedObjectDecoder(
	SERIALIZER,
	SERIALIZER_KEY,
)((input: TransferrableTokensParticleInput) => create(input))

const jsonDecoding = JSONDecoding.withDependencies(
	Address,
	Amount,
	ResourceIdentifier,
)
	.withDecoders(JSONDecoder)
	.create<TransferrableTokensParticleT>()

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
		...serialization(props),

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
	...jsonDecoding,
	create,
}
