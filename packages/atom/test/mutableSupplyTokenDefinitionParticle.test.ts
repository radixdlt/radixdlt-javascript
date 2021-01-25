import { toAddress } from './helpers/utility'
import { amountInSmallestDenomination } from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'
import { mutableSupplyTokenDefinitionParticle } from '../src/mutableSupplyTokenDefinitionParticle'
import { tokenOwnerOnly } from '../dist/tokenPermissions'

describe('mutableSupplyTokenDefinitionParticle', () => {
	const address = toAddress(
		'9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
	)

	const supply = amountInSmallestDenomination(
		new UInt256('1000000000000000000000', 10),
	)

	it('can be created without specifying permissions', () => {
		const mutableSupplyTokDefPartResult = mutableSupplyTokenDefinitionParticle(
			{
				symbol: 'ABCD0123456789',
				name: 'Foobar Coin',
				description: 'Best coin ever',
				address: address,
			},
		)

		expect(mutableSupplyTokDefPartResult.isOk())
		const mutableSupplyTokDefParticle = mutableSupplyTokDefPartResult._unsafeUnwrap()

		expect(mutableSupplyTokDefParticle.resourceIdentifier.toString()).toBe(
			`/${address}/ABCD0123456789`,
		)

		expect(mutableSupplyTokDefParticle.name).toBe('Foobar Coin')
		expect(mutableSupplyTokDefParticle.description).toBe('Best coin ever')

		expect(
			mutableSupplyTokDefParticle.permissions.equals(tokenOwnerOnly),
		).toBe(true)
	})
})
