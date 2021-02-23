import { Address } from '@radixdlt/crypto'
import { JSONDecoding, objectDecoder } from '@radixdlt/data-formats'
import { Amount, AmountT, granularityDefault } from '@radixdlt/primitives'
import { Result, err } from 'neverthrow'
import { ResourceIdentifier } from '../resourceIdentifier'
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

const radixParticleType = RadixParticleType.FIXED_SUPPLY_TOKEN_DEFINITION

const SERIALIZER = 'radix.particles.fixed_supply_token_definition'

const { JSONDecoders, fromJSON } = JSONDecoding<FixedSupplyTokenDefinitionParticleT>(
	ResourceIdentifier,
	Address,
	Amount
)(
	objectDecoder(
		SERIALIZER,
		(input: TokenDefinitionParticleInput &
			Readonly<{
				supply: AmountT
			}>) => create(input)
	)
)

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
	fromJSON,
	JSONDecoders,
	create
}
