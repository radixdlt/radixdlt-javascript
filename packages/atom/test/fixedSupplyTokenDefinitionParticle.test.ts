import { amountInSmallestDenomination } from '@radixdlt/primitives'
import { fixedSupplyTokenDefinitionParticle } from '../src/particles/fixedSupplyTokenDefinitionParticle'
import { toAddress } from './helpers/utility'
import { UInt256 } from '@radixdlt/uint256'
import { doTestTokenDefintionParticle } from './helpers/tokenDefinitionParticleBase'

describe('fixedSupplyTokenDefinitionParticle', () => {
	const address = toAddress(
		'9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
	)

	const supply = amountInSmallestDenomination(
		new UInt256('1000000000000000000000', 10),
	)

	const input = {
		symbol: 'ABCD0123456789',
		name: 'Foobar Coin',
		description: 'Best coin ever',
		address: address,
		supply: supply,
		url: 'https://foobar.com',
		iconURL: 'https://foobar.com/icon.png',
	}

	doTestTokenDefintionParticle(input, fixedSupplyTokenDefinitionParticle)

	it('supply equals the inputted supply', () => {
		const fixedSupplyTokenDefinitionParticle_ = fixedSupplyTokenDefinitionParticle(
			input,
		)._unsafeUnwrap()

		expect(
			fixedSupplyTokenDefinitionParticle_.fixedTokenSupply.equals(supply),
		).toBe(true)
	})

	it('cannot be created with a supply not being a multiple of granularity', () => {
		const tokenDefinitionParticleResult = fixedSupplyTokenDefinitionParticle(
			{
				...input,
				supply: amountInSmallestDenomination(UInt256.valueOf(2)),
				granularity: amountInSmallestDenomination(UInt256.valueOf(4)), // 4 ∤ 2
			},
		)

		tokenDefinitionParticleResult.match(
			(r) => fail('expected error, but got none'),
			(f) =>
				expect(f.message).toBe(
					'Supply not multiple of granularity (granularity=4 ∤ supply=2).',
				),
		)
	})
})
