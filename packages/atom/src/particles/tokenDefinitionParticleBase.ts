import { combine, err, ok, Result } from 'neverthrow'
import { Address } from '@radixdlt/crypto'
import { Granularity } from '@radixdlt/primitives'
import { ParticleBase, TokenDefinitionParticleBase } from './_types'
import { granularityDefault } from '@radixdlt/primitives'
import { RadixParticleType } from './meta/radixParticleTypes'
import { resourceIdentifierFromAddressAndName } from '../resourceIdentifier'

export type URLInput = string | URL

export const validateURLInput = (
	urlInput: URLInput | undefined,
): Result<string | undefined, Error> => {
	if (urlInput === undefined) return ok(undefined)
	if (typeof urlInput === 'string') {
		// eslint-disable-next-line functional/no-try-statement
		try {
			const url = new URL(urlInput)
			return ok(url.toString())
		} catch {
			return err(
				new Error(`Failed to create url from string: '${urlInput}'.`),
			)
		}
	} else {
		return ok(urlInput.toJSON())
	}
}

export const onlyUppercasedAlphanumerics = (input: string): boolean => {
	return new RegExp('^[A-Z0-9]+$').test(input)
}

export const RADIX_TOKEN_NAME_MIN_LENGTH = 2
export const RADIX_TOKEN_NAME_MAX_LENGTH = 64

export const RADIX_TOKEN_SYMBOL_MIN_LENGTH = 1
export const RADIX_TOKEN_SYMBOL_MAX_LENGTH = 14

export const RADIX_TOKEN_DESCRIPTION_MAX_LENGTH = 200

export const validateTokenDefinitionSymbol = (
	symbol: string,
): Result<string, Error> => {
	if (
		symbol.length < RADIX_TOKEN_SYMBOL_MIN_LENGTH ||
		symbol.length > RADIX_TOKEN_SYMBOL_MAX_LENGTH
	) {
		return err(
			new Error(
				`Bad length of token defintion symbol, should be between ${RADIX_TOKEN_SYMBOL_MIN_LENGTH}-${RADIX_TOKEN_SYMBOL_MAX_LENGTH} chars, but was ${symbol.length}.`,
			),
		)
	}
	return onlyUppercasedAlphanumerics(symbol)
		? ok(symbol)
		: err(
				new Error(
					`Symbol contains disallowed characters, only uppercase alphanumerics are allowed.`,
				),
		  )
}

export const validateTokenDefinitionName = (
	name: string,
): Result<string, Error> => {
	if (
		name.length < RADIX_TOKEN_NAME_MIN_LENGTH ||
		name.length > RADIX_TOKEN_NAME_MAX_LENGTH
	) {
		return err(
			new Error(
				`Bad length of token defintion name, should be between ${RADIX_TOKEN_NAME_MIN_LENGTH}-${RADIX_TOKEN_NAME_MAX_LENGTH} chars, but was ${name.length}.`,
			),
		)
	}
	return ok(name)
}

export const validateDescription = (
	description: string | undefined,
): Result<string | undefined, Error> => {
	if (description === undefined) return ok(undefined)
	return description.length <= RADIX_TOKEN_DESCRIPTION_MAX_LENGTH
		? ok(description)
		: err(
				new Error(
					`Bad length of token description, should be less than ${RADIX_TOKEN_DESCRIPTION_MAX_LENGTH}, but was ${description.length}.`,
				),
		  )
}

const notUndefinedOrCrash = <T>(value: T | undefined): T => {
	if (value === undefined) {
		// eslint-disable-next-line functional/no-throw-statement
		throw new Error(
			'Incorrect implementation, really expected a value but got undefined. ☢️',
		)
	}
	return value
}

export type TokenDefinitionParticleInput = Readonly<{
	symbol: string
	name: string
	description?: string
	address: Address
	granularity?: Granularity
	url?: URLInput
	iconURL?: URLInput
}>

// eslint-disable-next-line max-lines-per-function
export const baseTokenDefinitionParticle = (
	input: TokenDefinitionParticleInput &
		Readonly<{
			radixParticleType: RadixParticleType
			makeEquals: (
				thisParticle: TokenDefinitionParticleBase,
				other: ParticleBase,
			) => boolean
		}>,
): Result<TokenDefinitionParticleBase, Error> => {
	return combine([
		validateTokenDefinitionSymbol(input.symbol),
		validateTokenDefinitionName(input.name),
		validateDescription(input.description),
		validateURLInput(input.url).mapErr(
			(e) => new Error(`Invalid token info url. ${e.message}`),
		),
		validateURLInput(input.iconURL).mapErr(
			(e) => new Error(`Invalid token icon url. ${e.message}`),
		),
	]).map(
		(resultList): TokenDefinitionParticleBase => {
			const thisBase = <TokenDefinitionParticleBase>{
				radixParticleType: input.radixParticleType,
				name: resultList[1],
				description: resultList[2],
				granularity: input.granularity ?? granularityDefault,
				resourceIdentifier: resourceIdentifierFromAddressAndName({
					address: input.address,
					name: notUndefinedOrCrash(resultList[0]),
				}),
				url: resultList[3],
				iconURL: resultList[4],
				equals: (other: ParticleBase) => {
					// eslint-disable-next-line functional/no-throw-statement
					throw new Error(
						`Please override and use ${JSON.stringify(other)}`,
					)
				},
			}

			return {
				...thisBase,
				equals: (other: ParticleBase): boolean =>
					input.makeEquals(thisBase, other),
			}
		},
	)
}

// eslint-disable-next-line complexity
export const isTokenDefinitionParticleBase = (
	something: unknown,
): something is TokenDefinitionParticleBase => {
	const inspection = something as TokenDefinitionParticleBase
	return (
		inspection.radixParticleType !== undefined &&
		inspection.resourceIdentifier !== undefined &&
		inspection.granularity !== undefined &&
		inspection.name !== undefined &&
		inspection.equals !== undefined
	)
}