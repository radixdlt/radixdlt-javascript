import { Amount, granularityDefault } from '@radixdlt/primitives'
import { Result, err } from 'neverthrow'
import { RadixParticleType } from './meta/radixParticleTypes'
import {
	baseTokenDefinitionParticle,
	isTokenDefinitionParticleBase,
	TokenDefinitionParticleInput,
} from './tokenDefinitionParticleBase'
import {
	FixedSupplyTokenDefinitionParticle,
	ParticleBase,
	TokenDefinitionParticleBase,
} from './_types'

const radixParticleType = RadixParticleType.FIXED_SUPPLY_TOKEN_DEFINITION

export const fixedSupplyTokenDefinitionParticle = (
	input: TokenDefinitionParticleInput &
		Readonly<{
			supply: Amount
		}>,
): Result<FixedSupplyTokenDefinitionParticle, Error> => {
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
		serializer: 'radix.particles.fixed_supply_token_definition',
		radixParticleType: RadixParticleType.FIXED_SUPPLY_TOKEN_DEFINITION,
		specificEncodableKeyValues: [
			{
				key: 'supply',
				value: fixedTokenSupply,
			},
		],
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
		): FixedSupplyTokenDefinitionParticle => ({
			...base,
			fixedTokenSupply: fixedTokenSupply,
		}),
	)
}

export const isFixedTokenDefinitionParticle = (
	something: unknown,
): something is FixedSupplyTokenDefinitionParticle => {
	if (!isTokenDefinitionParticleBase(something)) return false
	return something.radixParticleType === radixParticleType
}
