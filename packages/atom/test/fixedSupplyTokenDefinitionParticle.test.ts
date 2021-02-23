import { Denomination, granularityDefault } from '@radixdlt/primitives'
import { toAddress } from './helpers/utility'
import { UInt256 } from '@radixdlt/uint256'
import { doTestTokenDefintionParticle } from './helpers/tokenDefinitionParticleBaseTests'
import { RadixParticleType } from '../src/particles/meta/radixParticleTypes'
import { FixedSupplyTokenDefinitionParticle } from '../src/particles/fixedSupplyTokenDefinitionParticle'
import { Amount } from '@radixdlt/primitives/src/amount'
import { JSONDecodableObject } from '@radixdlt/data-formats'

describe('fixedSupplyTokenDefinitionParticle', () => {
	const address = toAddress(
		'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
	)

	const supply = Amount.fromUInt256({
		magnitude: UInt256.valueOf(10),
		denomination: Denomination.Whole,
	})._unsafeUnwrap()

	const input = {
		symbol: 'ABCD0123456789',
		name: 'Foobar Coin',
		description: 'Best coin ever',
		address: address,
		granularity: granularityDefault,
		supply: supply,
		url: 'https://foobar.com',
		iconURL: 'https://foobar.com/icon.png',
	}

	doTestTokenDefintionParticle(
		input,
		RadixParticleType.FIXED_SUPPLY_TOKEN_DEFINITION,
		FixedSupplyTokenDefinitionParticle.create,
	)

	it('supply equals the inputted supply', () => {
		const fixedSupplyTokenDefinitionParticle_ = FixedSupplyTokenDefinitionParticle.create(
			input,
		)._unsafeUnwrap()

		expect(
			fixedSupplyTokenDefinitionParticle_.fixedTokenSupply.equals(supply),
		).toBe(true)
	})

	it('cannot be created with a supply not being a multiple of granularity', () => {
		const tokenDefinitionParticleResult = FixedSupplyTokenDefinitionParticle.create(
			{
				...input,
				supply: Amount.fromUnsafe(2)._unsafeUnwrap(),
				granularity: Amount.fromUnsafe(4)._unsafeUnwrap(), // 4 ∤ 2
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

	describe('serialization', () => {
		describe('should be able to dson encode', () => {
			it('should encode dson when all optional props are set', () => {
				const fixedSupplyTokenDefinitionParticle_ = FixedSupplyTokenDefinitionParticle.create(
					input,
				)._unsafeUnwrap()
	
				const expected =
					'bf6b6465736372697074696f6e6e4265737420636f696e20657665726b6772616e756c61726974795821050000000000000000000000000000000000000000000000000de0b6b3a76400006769636f6e55726c781b68747470733a2f2f666f6f6261722e636f6d2f69636f6e2e706e67646e616d656b466f6f62617220436f696e637272695845062f3953386b684c485a6136467379476f36333478516f3951774c67534847705848485737363444356d50594263726e665a563652542f41424344303132333435363738396a73657269616c697a6572782d72616469782e7061727469636c65732e66697865645f737570706c795f746f6b656e5f646566696e6974696f6e66737570706c795821050000000000000000000000000000000000000000000000008ac7230489e800006375726c7268747470733a2f2f666f6f6261722e636f6dff'
	
				const dson = fixedSupplyTokenDefinitionParticle_
					.toDSON()
					._unsafeUnwrap()
	
				expect(dson.toString('hex')).toBe(expected)
			})
		})

		it('should be able to JSON encode', () => {
			const fixedSupplyTokenDefinitionParticle_ = FixedSupplyTokenDefinitionParticle.create(
				input,
			)._unsafeUnwrap()

			const json = fixedSupplyTokenDefinitionParticle_.toJSON()._unsafeUnwrap()

			const expected = {
				serializer: FixedSupplyTokenDefinitionParticle.SERIALIZER,
				symbol: ':str:ABCD0123456789',
				name: ':str:Foobar Coin',
				description: ':str:Best coin ever',
				address: address.toJSON()._unsafeUnwrap(),
				granularity: granularityDefault.toJSON()._unsafeUnwrap(),
				supply: supply.toJSON()._unsafeUnwrap(),
				url: ':str:https://foobar.com',
				iconURL: ':str:https://foobar.com/icon.png',
			}
			
			expect(json).toEqual(expected)
		})

		it('should be able to JSON decode', () => {
			const fixedSupplyTokenDefinitionParticle_ = FixedSupplyTokenDefinitionParticle.create(
				input,
			)._unsafeUnwrap()

			const json: JSONDecodableObject = {
				serializer: FixedSupplyTokenDefinitionParticle.SERIALIZER,
				symbol: ':str:ABCD0123456789',
				name: ':str:Foobar Coin',
				description: ':str:Best coin ever',
				address: address.toJSON()._unsafeUnwrap(),
				granularity: granularityDefault.toJSON()._unsafeUnwrap(),
				supply: supply.toJSON()._unsafeUnwrap(),
				url: ':str:https://foobar.com',
				iconURL: ':str:https://foobar.com/icon.png',
			}

			const result = FixedSupplyTokenDefinitionParticle.fromJSON(
				json,
			)._unsafeUnwrap()

			expect(fixedSupplyTokenDefinitionParticle_.equals(result)).toBe(true)
		})
	})



})
