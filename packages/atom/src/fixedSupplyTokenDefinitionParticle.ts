import {
	FixedSupplyTokenDefinitionParticle,
	ParticleBase,
	Supply,
} from './_types'
import { Address } from '@radixdlt/crypto'
import { Granularity } from '@radixdlt/primitives'
import { granularityDefault } from '@radixdlt/primitives/dist/granularity'
import { Result, ok, err, combine } from 'neverthrow'
import { resourceIdentifierFromAddressAndName } from './resourceIdentifier'
import { RadixParticleType } from './radixParticleTypes'

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

export const validateTokenDefinitionSymbol = (
	symbol: string,
): Result<string, Error> => {
	const minLength = 1
	const maxLength = 14
	if (symbol.length < minLength || symbol.length > 14) {
		return err(
			new Error(
				`Bad length of token defintion symbol, should be between ${minLength}-${maxLength} chars, but was ${symbol.length}.`,
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
	const minLength = 2
	const maxLength = 64
	if (name.length < minLength || name.length > 14) {
		return err(
			new Error(
				`Bad length of token defintion name, should be between ${minLength}-${maxLength} chars, but was ${name.length}.`,
			),
		)
	}
	return ok(name)
}

const TOKEN_DESCRIPTION_MAX_LENGTH = 200 as const
export const validateDescription = (
	description: string | undefined,
): Result<string | undefined, Error> => {
	if (description === undefined) return ok(undefined)
	return description.length <= TOKEN_DESCRIPTION_MAX_LENGTH
		? ok(description)
		: err(
				new Error(
					`Bad length of token description, should be less than ${TOKEN_DESCRIPTION_MAX_LENGTH}, but was ${description.length}.`,
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

// eslint-disable-next-line max-lines-per-function
export const fixedSupplyTokenDefinitionParticle = (
	input: Readonly<{
		symbol: string
		name: string
		description?: string
		address: Address
		supply: Supply
		granularity?: Granularity
		url?: URLInput
		iconURL?: URLInput
	}>,
): Result<FixedSupplyTokenDefinitionParticle, Error> => {
	const granularity = input.granularity ?? granularityDefault
	const address = input.address
	const fixedTokenSupply = input.supply

	if (!fixedTokenSupply.isMultipleOf(granularity)) {
		return err(
			new Error(
				`Supply not multiple of granularity (granularity=${granularity.toString()} ∤ supply=${fixedTokenSupply.toString()}).`,
			),
		)
	}

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
		(resultList): FixedSupplyTokenDefinitionParticle => {
			const symbol = notUndefinedOrCrash(resultList[0])
			const name = resultList[1]
			const description = resultList[2]
			const url = resultList[3]
			const iconURL = resultList[4]
			const resourceIdentifier = resourceIdentifierFromAddressAndName({
				address,
				/* NOT 'name', should be 'symbol; */
				name: symbol,
			})
			return <FixedSupplyTokenDefinitionParticle>{
				radixParticleType:
					RadixParticleType.FIXED_SUPPLY_TOKEN_DEFINITION,
				name,
				description,
				granularity,
				resourceIdentifier,
				url,
				iconURL,
				fixedTokenSupply,
				// eslint-disable-next-line complexity
				equals: (other: ParticleBase): boolean => {
					if (!isFixedTokenDefinitionParticle(other)) return false
					const otherFTSDP = other
					return (
						otherFTSDP.name === name &&
						otherFTSDP.description === description &&
						otherFTSDP.granularity.equals(granularity) &&
						otherFTSDP.resourceIdentifier.equals(
							resourceIdentifier,
						) &&
						otherFTSDP.fixedTokenSupply.equals(fixedTokenSupply) &&
						otherFTSDP.url === url &&
						otherFTSDP.iconURL === iconURL
					)
				},
			}
		},
	)
}

// eslint-disable-next-line complexity
export const isFixedTokenDefinitionParticle = (
	something: unknown,
): something is FixedSupplyTokenDefinitionParticle => {
	const inspection = something as FixedSupplyTokenDefinitionParticle
	return (
		inspection.radixParticleType ===
			RadixParticleType.FIXED_SUPPLY_TOKEN_DEFINITION &&
		inspection.resourceIdentifier !== undefined &&
		inspection.granularity !== undefined &&
		inspection.name !== undefined &&
		inspection.equals !== undefined &&
		inspection.fixedTokenSupply !== undefined
	)
}
