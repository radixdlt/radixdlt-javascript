import { Result } from 'neverthrow'
import { granularityDefault } from '@radixdlt/primitives'
import {
	TokenDefinitionParticleInput,
	RADIX_TOKEN_SYMBOL_MAX_LENGTH,
	isMutableTokenDefinitionParticle,
	isFixedTokenDefinitionParticle,
} from '../../'
import { TokenDefinitionParticleBase } from '../../src/particles/_types'
import { RadixParticleType } from '../../src/particles/meta/radixParticleTypes'

// eslint-disable-next-line max-lines-per-function
export const doTestTokenDefintionParticle = <
	P extends TokenDefinitionParticleBase,
	I extends TokenDefinitionParticleInput
>(
	input: I,
	particleType: RadixParticleType,
	ctor: (input: I) => Result<P, Error>,
): void => {
	it('should have the correct particle type', () => {
		const tokenDefinitionParticle = ctor(input)._unsafeUnwrap()

		switch (particleType) {
			case RadixParticleType.FIXED_SUPPLY_TOKEN_DEFINITION:
				expect(
					isMutableTokenDefinitionParticle(tokenDefinitionParticle),
				).toBe(false)
				expect(
					isFixedTokenDefinitionParticle(tokenDefinitionParticle),
				).toBe(true)
				break
			case RadixParticleType.MUTABLE_SUPPLY_TOKEN_DEFINITION:
				expect(
					isMutableTokenDefinitionParticle(tokenDefinitionParticle),
				).toBe(true)
				expect(
					isFixedTokenDefinitionParticle(tokenDefinitionParticle),
				).toBe(false)
				break
			default:
				break
		}

		expect(tokenDefinitionParticle.radixParticleType).toBe(particleType)
	})

	it('can be created', () => {
		const tokenDefinitionParticle = ctor(input)._unsafeUnwrap()

		expect(tokenDefinitionParticle.resourceIdentifier.toString()).toBe(
			`/${input.address.toString()}/ABCD0123456789`,
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
			() => {
				throw Error('expected error, but got none')
			},
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
			() => {
				throw Error('expected error, but got none')
			},
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
			() => {
				throw Error('expected error, but got none')
			},
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
			() => {
				throw Error('expected error, but got none')
			},
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
			() => {
				throw Error('expected error, but got none')
			},
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
				() => {
					throw Error('expected error, but got none')
				},
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
			() => {
				throw Error('expected error, but got none')
			},
			(f) =>
				expect(f.message).toBe(
					'Bad length of token description, should be less than 200, but was 212.',
				),
		)
	})
}
