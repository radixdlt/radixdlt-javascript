import {
	amountFromUInt256,
	amountInSmallestDenomination,
	Denomination,
	granularityDefault,
} from '@radixdlt/primitives'
import { fixedSupplyTokenDefinitionParticle } from '../src/fixedSupplyTokenDefinitionParticle'
import { toAddress } from './helpers/utility'
import { UInt256 } from '@radixdlt/uint256'
import { doTestTokenDefintionParticle } from './helpers/tokenDefinitionParticleBaseTests'
import { RadixParticleType } from '../src/particles/meta/radixParticleTypes'

describe('fixedSupplyTokenDefinitionParticle', () => {
	const address = toAddress(
		'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
	)

	const supply = amountFromUInt256({
		magnitude: UInt256.valueOf(10),
		denomination: Denomination.Atto,
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
		fixedSupplyTokenDefinitionParticle,
	)

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

	describe('should be able to dson encode', () => {
		it('should encode dson when all optional props are set', () => {
			const fixedSupplyTokenDefinitionParticle_ = fixedSupplyTokenDefinitionParticle(
				input,
			)._unsafeUnwrap()

			const expected =
				'bf6b6465736372697074696f6e6e4265737420636f696e20657665726b6772616e756c617269747958210500000000000000000000000000000000000000000000000000000000000000016769636f6e55726c781b68747470733a2f2f666f6f6261722e636f6d2f69636f6e2e706e67646e616d656b466f6f62617220436f696e637272695845062f3953386b684c485a6136467379476f36333478516f3951774c67534847705848485737363444356d50594263726e665a563652542f41424344303132333435363738396a73657269616c697a6572782d72616469782e7061727469636c65732e66697865645f737570706c795f746f6b656e5f646566696e6974696f6e66737570706c79582105000000000000000000000000000000000000000000000000000000000000000a6375726c7268747470733a2f2f666f6f6261722e636f6d6776657273696f6e1864ff'

			const dson = fixedSupplyTokenDefinitionParticle_
				.toDSON()
				._unsafeUnwrap()

			expect(dson.toString('hex')).toBe(expected)
		})
	})
})
