import { toAddress } from './helpers/utility'
import { mutableSupplyTokenDefinitionParticle } from '../src/particles/mutableSupplyTokenDefinitionParticle'
import { tokenOwnerOnly } from '../src/tokenPermissions'
import { doTestTokenDefintionParticle } from './helpers/tokenDefinitionParticleBase'
import { RadixParticleType } from '../dist/particles/meta/radixParticleTypes'

describe('mutableSupplyTokenDefinitionParticle', () => {
	const address = toAddress(
		'9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
	)

	const input = {
		symbol: 'ABCD0123456789',
		name: 'Foobar Coin',
		description: 'Best coin ever',
		address: address,
		permissions: tokenOwnerOnly,
		url: 'https://foobar.com',
		iconURL: 'https://foobar.com/icon.png',
	}

	doTestTokenDefintionParticle(
		input,
		RadixParticleType.MUTABLE_SUPPLY_TOKEN_DEFINITION,
		mutableSupplyTokenDefinitionParticle,
	)

	it('permissions equals the inputted permissions', () => {
		const mutableSupplyTokenDefinitionParticle_ = mutableSupplyTokenDefinitionParticle(
			input,
		)._unsafeUnwrap()

		expect(
			mutableSupplyTokenDefinitionParticle_.permissions.equals(
				tokenOwnerOnly,
			),
		).toBe(true)
	})
})
