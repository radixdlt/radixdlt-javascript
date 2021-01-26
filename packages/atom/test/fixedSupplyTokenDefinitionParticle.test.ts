import { amountInSmallestDenomination } from '@radixdlt/primitives'
import { fixedSupplyTokenDefinitionParticle } from '../src/fixedSupplyTokenDefinitionParticle'
import { toAddress } from './helpers/utility'
import { UInt256 } from '@radixdlt/uint256'
import { Result } from 'neverthrow'
import { granularityDefault } from '@radixdlt/primitives/dist/granularity'
import {
	TokenDefinitionParticleInput,
	RADIX_TOKEN_SYMBOL_MAX_LENGTH,
} from '../src/tokenDefinitionParticleBase'
import { TokenDefinitionParticleBase } from '../src/_types'

export const doTestTokenDefintionParticle = <
	P extends TokenDefinitionParticleBase,
	I extends TokenDefinitionParticleInput
>(
	input: I,
	ctor: (input: I) => Result<P, Error>,
): void => {
	it('can be created', () => {
		const tokenDefinitionParticle = ctor(input)._unsafeUnwrap()
		expect(tokenDefinitionParticle.resourceIdentifier.toString()).toBe(
			`/${input.address}/ABCD0123456789`,
		)

		expect(tokenDefinitionParticle.name).toBe('Foobar Coin')
		expect(tokenDefinitionParticle.description).toBe('Best coin ever')
		expect(tokenDefinitionParticle.url).toBe('https://foobar.com/')
		expect(tokenDefinitionParticle.iconURL).toBe(
			'https://foobar.com/icon.png',
		)
	})

	it('has a default granularity with value 1 whole', () => {
		const tokenDefinitionParticle = ctor(input)._unsafeUnwrap()
		expect(
			tokenDefinitionParticle.granularity.equals(granularityDefault),
		).toBe(true)
	})

	it('cannot be created with an invalid token url (even though it is optional)', () => {
		const tokenDefinitionParticleResult = ctor({
			...input,
			url: '~invalid_url~',
		})

		tokenDefinitionParticleResult.match(
			(r) => fail('expected error, but got none'),
			(f) =>
				expect(f.message).toBe(
					`Invalid token info url. Failed to create url from string: '~invalid_url~'.`,
				),
		)
	})

	it('cannot be created with an invalid icon url (even though it is optional)', () => {
		const tokenDefinitionParticleResult = ctor({
			...input,
			iconURL: '~invalid_icon_url~',
		})

		tokenDefinitionParticleResult.match(
			(r) => fail('expected error, but got none'),
			(f) =>
				expect(f.message).toBe(
					`Invalid token icon url. Failed to create url from string: '~invalid_icon_url~'.`,
				),
		)
	})

	it('cannot be created with a symbol being too short', () => {
		const tokenDefinitionParticleResult = ctor({
			...input,
			symbol: '', // <--- TOO SHORT 'symbol'
		})

		tokenDefinitionParticleResult.match(
			(r) => fail('expected error, but got none'),
			(f) =>
				expect(f.message).toBe(
					'Bad length of token defintion symbol, should be between 1-14 chars, but was 0.',
				),
		)
	})

	it('cannot be created with a symbol being too long', () => {
		const tokenDefinitionParticleResult = ctor({
			...input,
			symbol: 'TOO9LONG9SYMBOL', // <--- TOO SHORT 'symbol'
		})

		tokenDefinitionParticleResult.match(
			(r) => fail('expected error, but got none'),
			(f) =>
				expect(f.message).toBe(
					'Bad length of token defintion symbol, should be between 1-14 chars, but was 15.',
				),
		)
	})

	it('cannot be created with a symbol containing lowercase characters', () => {
		const tokenDefinitionParticleResult = ctor({
			...input,
			symbol: 'lowercaseBAD', // <--- DISALLOWED lowercase CHARS IN 'symbol'
		})

		tokenDefinitionParticleResult.match(
			(r) => fail('expected error, but got none'),
			(f) =>
				expect(f.message).toBe(
					'Symbol contains disallowed characters, only uppercase alphanumerics are allowed.',
				),
		)
	})

	it('cannot be created with a symbol containing disallowed special characters', () => {
		const goodSymbolPrefix = 'GOOD'

		'_.?!$@(),#[]/|\\*'.split('').forEach((bad) => {
			expect(goodSymbolPrefix.length + bad.length).toBeLessThanOrEqual(
				RADIX_TOKEN_SYMBOL_MAX_LENGTH,
			)

			ctor({
				...input,
				symbol: `${goodSymbolPrefix}${bad}`,
			}).match(
				(r) => fail('expected error, but got none'),
				(f) =>
					expect(f.message).toBe(
						'Symbol contains disallowed characters, only uppercase alphanumerics are allowed.',
					),
			)
		})
	})

	it('can have numbers in symbol', () => {
		const symbol = 'F00B4R'
		const tokenDefinitionParticle = ctor({
			...input,
			symbol,
		})._unsafeUnwrap()
		expect(tokenDefinitionParticle.resourceIdentifier.name).toBe(symbol)
	})

	it('cannot be created with a description being too long', () => {
		const tokenDefinitionParticleResult = ctor({
			...input,
			description: `A very very very very very very very very very very
			 long description that exceeds the maximum allowed number of 
			 characters for a description which is at the 
			 very least shorter than this long string.`, // <--- TOO LONG 'description'
		})

		tokenDefinitionParticleResult.match(
			(r) => fail('expected error, but got none'),
			(f) =>
				expect(f.message).toBe(
					'Bad length of token description, should be less than 200, but was 212.',
				),
		)
	})
}

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