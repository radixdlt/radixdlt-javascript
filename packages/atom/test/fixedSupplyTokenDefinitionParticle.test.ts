import { amountInSmallestDenomination } from '@radixdlt/primitives'
import { fixedSupplyTokenDefinitionParticle } from '../src/fixedSupplyTokenDefinitionParticle'
import { toAddress } from './helpers/utility'
import { UInt256 } from '@radixdlt/uint256'

describe('fixedSupplyTokenDefinitionParticle', () => {
	const address = toAddress(
		'9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
	)

	const supply = amountInSmallestDenomination(
		new UInt256('1000000000000000000000', 10),
	)

	it('can be safely created from safe type', async () => {
		const fixedSupplyTokDefPartResult = fixedSupplyTokenDefinitionParticle({
			symbol: 'ABCD0123456789',
			name: 'Foobar Coin',
			description: 'Best coin ever',
			address: address,
			supply: supply,
			url: 'https://foobar.com',
			iconURL: 'https://foobar.com/icon.png',
		})

		expect(fixedSupplyTokDefPartResult.isOk())
		const fixedSupplyTokDefParticle = fixedSupplyTokDefPartResult._unsafeUnwrap()

		expect(fixedSupplyTokDefParticle.resourceIdentifier.toString()).toBe(
			`/${address}/ABCD0123456789`,
		)

		expect(fixedSupplyTokDefParticle.name).toBe('Foobar Coin')
		expect(fixedSupplyTokDefParticle.description).toBe('Best coin ever')
		expect(fixedSupplyTokDefParticle.url).toBe('https://foobar.com/')
		expect(fixedSupplyTokDefParticle.iconURL).toBe(
			'https://foobar.com/icon.png',
		)
		expect(fixedSupplyTokDefParticle.fixedTokenSupply.equals(supply)).toBe(
			true,
		)
	})

	it('cannot be created with a supply not being a multiple of granularity', () => {
		const fixedSupplyTokDefPartResult = fixedSupplyTokenDefinitionParticle({
			symbol: 'FOOBAR',
			name: 'Foobar Coin',
			address: address,
			supply: amountInSmallestDenomination(UInt256.valueOf(2)),
			granularity: amountInSmallestDenomination(UInt256.valueOf(4)), // 4 ∤ 2
		})
		fixedSupplyTokDefPartResult.match(
			(r) => fail('expected error, but got none'),
			(f) =>
				expect(f.message).toBe(
					'Supply not multiple of granularity (granularity=4 ∤ supply=2).',
				),
		)
	})

	it('cannot be created with an invalid token url (even though it is optional)', () => {
		const fixedSupplyTokDefPartResult = fixedSupplyTokenDefinitionParticle({
			symbol: 'FOOBAR',
			name: 'Foobar Coin',
			address: address,
			supply: supply,
			url: '~invalid_url~', // <--- INVALID 'url'
		})
		fixedSupplyTokDefPartResult.match(
			(r) => fail('expected error, but got none'),
			(f) =>
				expect(f.message).toBe(
					`Invalid token info url. Failed to create url from string: '~invalid_url~'.`,
				),
		)
	})

	it('cannot be created with an invalid icon url (even though it is optional)', () => {
		const fixedSupplyTokDefPartResult = fixedSupplyTokenDefinitionParticle({
			symbol: 'FOOBAR',
			name: 'Foobar Coin',
			address: address,
			supply: supply,
			iconURL: '~invalid_icon_url~', // <--- INVALID 'iconURL'
		})
		fixedSupplyTokDefPartResult.match(
			(r) => fail('expected error, but got none'),
			(f) =>
				expect(f.message).toBe(
					`Invalid token icon url. Failed to create url from string: '~invalid_icon_url~'.`,
				),
		)
	})

	it('cannot be created with a symbol being too short', () => {
		const fixedSupplyTokDefPartResult = fixedSupplyTokenDefinitionParticle({
			symbol: '', // <--- TOO SHORT 'symbol'
			name: 'Foobar Coin',
			address: address,
			supply: supply,
		})
		fixedSupplyTokDefPartResult.match(
			(r) => fail('expected error, but got none'),
			(f) =>
				expect(f.message).toBe(
					'Bad length of token defintion symbol, should be between 1-14 chars, but was 0.',
				),
		)
	})

	it('cannot be created with a symbol being too long', () => {
		const fixedSupplyTokDefPartResult = fixedSupplyTokenDefinitionParticle({
			symbol: 'TOO9LONG9SYMBOL', // <--- TOO LONG 'symbol'
			name: 'Foobar Coin',
			address: address,
			supply: supply,
		})
		fixedSupplyTokDefPartResult.match(
			(r) => fail('expected error, but got none'),
			(f) =>
				expect(f.message).toBe(
					'Bad length of token defintion symbol, should be between 1-14 chars, but was 15.',
				),
		)
	})

	it('cannot be created with a symbol containing lowercase characters', () => {
		const fixedSupplyTokDefPartResult = fixedSupplyTokenDefinitionParticle({
			symbol: 'lowercaseBAD', // <--- DISALLOWED lowercase CHARS IN 'symbol'
			name: 'Foobar Coin',
			address: address,
			supply: supply,
		})
		fixedSupplyTokDefPartResult.match(
			(r) => fail('expected error, but got none'),
			(f) =>
				expect(f.message).toBe(
					'Symbol contains disallowed characters, only uppercase alphanumerics are allowed.',
				),
		)
	})

	it('cannot be created with a symbol containing disallowed special characters', () => {
		const fixedSupplyTokDefPartResult = fixedSupplyTokenDefinitionParticle({
			symbol: 'BAD_CHARS!', // <--- TOO LONG 'symbol'
			name: 'Foobar Coin',
			address: address,
			supply: supply,
		})

		fixedSupplyTokDefPartResult.match(
			(r) => fail('expected error, but got none'),
			(f) =>
				expect(f.message).toBe(
					'Symbol contains disallowed characters, only uppercase alphanumerics are allowed.',
				),
		)
	})

	it('cannot be created with a description being too long', () => {
		const fixedSupplyTokDefPartResult = fixedSupplyTokenDefinitionParticle({
			symbol: 'F00B4R',
			description: `A very very very very very very very very very very
			 long description that exceeds the maximum allowed number of 
			 characters for a description which is at the 
			 very least shorter than this long string.`, // <--- TOO LONG 'description'
			name: 'Foobar Coin',
			address: address,
			supply: supply,
		})

		fixedSupplyTokDefPartResult.match(
			(r) => fail('expected error, but got none'),
			(f) =>
				expect(f.message).toBe(
					'Bad length of token description, should be less than 200, but was 212.',
				),
		)
	})
})
