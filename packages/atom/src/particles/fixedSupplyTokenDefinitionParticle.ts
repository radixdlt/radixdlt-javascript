import { Address } from '@radixdlt/account'
import { taggedObjectDecoder } from '@radixdlt/data-formats'
import { Amount, AmountT, granularityDefault } from '@radixdlt/primitives'
import { Result, err } from 'neverthrow'
import { ResourceIdentifier } from '../resourceIdentifier'
import { SERIALIZER_KEY } from '../_types'
import { RadixParticleType } from './meta/radixParticleTypes'
import {
	baseTokenDefinitionParticle,
	isTokenDefinitionParticleBase,
	TokenDefinitionParticleInput,
} from './tokenDefinitionParticleBase'
import {
	FixedSupplyTokenDefinitionParticleT,
	ParticleBase,
	TokenDefinitionParticleBase,
} from './_types'
import { JSONDecoding } from '../utils'

const radixParticleType = RadixParticleType.FIXED_SUPPLY_TOKEN_DEFINITION

const SERIALIZER = 'radix.particles.fixed_supply_token_definition'

const JSONDecoder = taggedObjectDecoder(
	SERIALIZER,
	SERIALIZER_KEY,
)((input: TokenDefinitionParticleInput & Readonly<{ supply: AmountT }>) =>
	create(input),
)

const jsonDecoding = JSONDecoding.withDependencies(
	ResourceIdentifier,
	Address,
	Amount,
)
	.withDecoders(JSONDecoder)
	.create<FixedSupplyTokenDefinitionParticleT>()

// eslint-disable-next-line max-lines-per-function
const create = (
	input: TokenDefinitionParticleInput &
		Readonly<{
			supply: AmountT
		}>,
): Result<FixedSupplyTokenDefinitionParticleT, Error> => {
	const fixedTokenSupply = input.supply
	const granularity = input.granularity ?? granularityDefault

	if (!fixedTokenSupply.isMultipleOf(granularity)) {
		return err(
			new Error(
				`Supply not multiple of granularity (granularity=${granularity.toString()} ∤ supply=${fixedTokenSupply.toString()}).`,
			),
		)
	}

	return baseTokenDefinitionParticle({
		...input,
		granularity: granularity,
		serializer: SERIALIZER,
		radixParticleType: RadixParticleType.FIXED_SUPPLY_TOKEN_DEFINITION,
		specificEncodableKeyValues: {
			supply: fixedTokenSupply,
		},
		// eslint-disable-next-line complexity
		makeEquals: (
			thisParticle: TokenDefinitionParticleBase,
			other: ParticleBase,
			// eslint-disable-next-line max-params
		): boolean => {
			if (!isFixedTokenDefinitionParticle(other)) return false
			const otherFSTDP = other
			const equalsBase =
				otherFSTDP.name === thisParticle.name &&
				otherFSTDP.description === thisParticle.description &&
				otherFSTDP.granularity.equals(thisParticle.granularity) &&
				otherFSTDP.resourceIdentifier.equals(
					thisParticle.resourceIdentifier,
				) &&
				otherFSTDP.url === thisParticle.url &&
				otherFSTDP.iconURL === thisParticle.iconURL

			return (
				equalsBase &&
				otherFSTDP.fixedTokenSupply.equals(fixedTokenSupply)
			)
		},
	}).map(
		(
			base: TokenDefinitionParticleBase,
		): FixedSupplyTokenDefinitionParticleT => ({
			...base,
			fixedTokenSupply: fixedTokenSupply,
		}),
	)
}

export const isFixedTokenDefinitionParticle = (
	something: unknown,
): something is FixedSupplyTokenDefinitionParticleT => {
	if (!isTokenDefinitionParticleBase(something)) return false
	return something.radixParticleType === radixParticleType
}

export const FixedSupplyTokenDefinitionParticle = {
	SERIALIZER,
	...jsonDecoding,
	create,
}
