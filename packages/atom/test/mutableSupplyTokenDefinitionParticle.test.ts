import { toAddress } from './helpers/utility'
import { mutableSupplyTokenDefinitionParticle } from '../src/mutableSupplyTokenDefinitionParticle'
import { tokenOwnerOnly, tokenPermissionsAll } from '../src/tokenPermissions'
import { doTestTokenDefintionParticle } from './helpers/tokenDefinitionParticleBase'
import { granularityDefault } from '@radixdlt/primitives'

describe('mutableSupplyTokenDefinitionParticle', () => {
	const address = toAddress(
		'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
	)

	const input = {
		symbol: 'ABCD0123456789',
		name: 'Foobar Coin',
		description: 'Best coin ever',
		address: address,
		granularity: granularityDefault,
		permissions: tokenPermissionsAll,
		url: 'https://foobar.com',
		iconURL: 'https://foobar.com/icon.png',
	}

	doTestTokenDefintionParticle(input, mutableSupplyTokenDefinitionParticle)

	it('permissions equals the inputted permissions', () => {
		const mutableSupplyTokenDefinitionParticle_ = mutableSupplyTokenDefinitionParticle(
			input,
		)._unsafeUnwrap()

		expect(
			mutableSupplyTokenDefinitionParticle_.permissions.equals(
				tokenPermissionsAll,
			),
		).toBe(true)
	})

	describe('should be able to dson encode', () => {
		it('should encode dson when all optional props are set', () => {
			const mutableSupplyTokenDefinitionParticle_ = mutableSupplyTokenDefinitionParticle(
				input,
			)._unsafeUnwrap()


			const expected =
				'bf6b6465736372697074696f6e6e4265737420636f696e20657665726b6772616e756c617269747958210500000000000000000000000000000000000000000000000000000000000000016769636f6e55726c781b68747470733a2f2f666f6f6261722e636f6d2f69636f6e2e706e67646e616d656b466f6f62617220436f696e6b7065726d697373696f6e73bf646275726e63616c6c646d696e7463616c6cff637272695845062f3953386b684c485a6136467379476f36333478516f3951774c67534847705848485737363444356d50594263726e665a563652542f41424344303132333435363738396a73657269616c697a6572782f72616469782e7061727469636c65732e6d757461626c655f737570706c795f746f6b656e5f646566696e6974696f6e6375726c7268747470733a2f2f666f6f6261722e636f6d6776657273696f6e1864ff'

			const dson = mutableSupplyTokenDefinitionParticle_
				.toDSON()
				._unsafeUnwrap()

			expect(dson.toString('hex')).toBe(expected)
		})
	})
})
