import { toAddress } from './helpers/utility'
import { tokenPermissionsAll } from '../src/tokenPermissions'
import { granularityDefault } from '@radixdlt/primitives'
import { RadixParticleType } from '../src/particles/meta/_index'
import { doTestTokenDefintionParticle } from './helpers/tokenDefinitionParticleBaseTests'
import { JSONDecodableObject } from '@radixdlt/data-formats'
import { MutableSupplyTokenDefinitionParticle } from '../dist/_index'

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
		permissions: tokenPermissionsAll.permissions,
		url: 'https://foobar.com',
		iconURL: 'https://foobar.com/icon.png',
	}

	doTestTokenDefintionParticle(
		input,
		RadixParticleType.MUTABLE_SUPPLY_TOKEN_DEFINITION,
		MutableSupplyTokenDefinitionParticle.create,
	)

	it('permissions equals the inputted permissions', () => {
		const mutableSupplyTokenDefinitionParticle_ = MutableSupplyTokenDefinitionParticle.create(
			input,
		)._unsafeUnwrap()

		expect(
			mutableSupplyTokenDefinitionParticle_.permissions.equals(
				tokenPermissionsAll,
			),
		).toBe(true)
	})

	describe('serialization', () => {
		const mutableSupplyTokenDefinitionParticle_ = MutableSupplyTokenDefinitionParticle.create(
			input,
		)._unsafeUnwrap()

		describe('dson', () => {
			it('should encode when all optional props are set', () => {
				const expected =
					'bf6b6465736372697074696f6e6e4265737420636f696e20657665726b6772616e756c61726974795821050000000000000000000000000000000000000000000000000de0b6b3a76400006769636f6e55726c781b68747470733a2f2f666f6f6261722e636f6d2f69636f6e2e706e67646e616d656b466f6f62617220436f696e6b7065726d697373696f6e73bf646275726e63616c6c646d696e7463616c6cff637272695845062f3953386b684c485a6136467379476f36333478516f3951774c67534847705848485737363444356d50594263726e665a563652542f41424344303132333435363738396a73657269616c697a6572782f72616469782e7061727469636c65732e6d757461626c655f737570706c795f746f6b656e5f646566696e6974696f6e6375726c7268747470733a2f2f666f6f6261722e636f6dff'

				const dson = mutableSupplyTokenDefinitionParticle_
					.toDSON()
					._unsafeUnwrap()

				expect(dson.toString('hex')).toBe(expected)
			})
		})

		describe('json', () => {
			it('should be able to encode', () => {
				const json = mutableSupplyTokenDefinitionParticle_
					.toJSON()
					._unsafeUnwrap()

				const expected = {
					serializer: MutableSupplyTokenDefinitionParticle.SERIALIZER,
					name: ':str:Foobar Coin',
					description: ':str:Best coin ever',
					granularity: granularityDefault.toJSON()._unsafeUnwrap(),
					url: ':str:https://foobar.com',
					rri: `:rri:/${address.toString()}/ABCD0123456789`,
					permissions: {
						mint: ':str:all',
						burn: ':str:all',
					},
					iconUrl: ':str:https://foobar.com/icon.png',
				}

				expect(json).toEqual(expected)
			})

			it('should be able to decode', () => {
				const json: JSONDecodableObject = {
					serializer: MutableSupplyTokenDefinitionParticle.SERIALIZER,
					symbol: ':str:ABCD0123456789',
					name: ':str:Foobar Coin',
					description: ':str:Best coin ever',
					address: address.toJSON()._unsafeUnwrap(),
					granularity: granularityDefault.toJSON()._unsafeUnwrap(),
					permissions: tokenPermissionsAll.toJSON()._unsafeUnwrap(),
					url: ':str:https://foobar.com',
					iconURL: ':str:https://foobar.com/icon.png',
				}

				const result = MutableSupplyTokenDefinitionParticle.fromJSON(
					json,
				)._unsafeUnwrap()

				expect(
					mutableSupplyTokenDefinitionParticle_.equals(result),
				).toBe(true)
			})
		})
	})
})
