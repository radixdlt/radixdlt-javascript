import { combine, err, ok, Result } from 'neverthrow'
import { AddressT } from '@radixdlt/crypto'
import { Granularity } from '@radixdlt/primitives'
import { ParticleBase, TokenDefinitionParticleBase } from './_types'
import { granularityDefault } from '@radixdlt/primitives'
import {
	CBOREncodableObject,
	CBOREncodablePrimitive,
	DSONCodable,
	DSONEncoding,
	DSONKeyValues,
	JSONDecoding,
	JSONEncoding,
	OutputMode,
	SerializableKeyValues,
} from '@radixdlt/data-formats'
import { isRadixParticle, RadixParticleType } from './meta/_index'
import { ResourceIdentifier } from '../resourceIdentifier'

export type URLInput = string | URL

export const validateURLInput = (
	urlInput: URLInput | undefined,
): Result<string | undefined, Error> => {
	if (urlInput === undefined) return ok(undefined)
	if (typeof urlInput === 'string') {
		try {
			new URL(urlInput)
			return ok(urlInput)
		} catch {
			return err(
				new Error(`Failed to create url from string: '${urlInput}'.`),
			)
		}
	} else {
		return ok(urlInput.toJSON())
	}
}

export const onlyUppercasedAlphanumerics = (input: string): boolean => new RegExp('^[A-Z0-9]+$').test(input)

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
	address: AddressT
	description?: string
	granularity?: Granularity
	url?: URLInput
	iconURL?: URLInput
}>

export const definedOrNonNull = <T>(value: T | null | undefined): value is T =>
	value !== null && value !== undefined

export type MaybeEncodableKeyValue = DSONKeyValues | undefined

export const keyValueIfPrimitivePresent = (
	input: Readonly<{
		key: string
		value?: CBOREncodablePrimitive
		outputMode?: OutputMode
	}>,
): MaybeEncodableKeyValue => {
	if (!definedOrNonNull(input.value)) return undefined
	const indeed: DSONKeyValues = {
		[input.key]: {
			value: input.value,
			outputMode: input.outputMode ?? OutputMode.ALL,
		},
	}

	return indeed
}

export const encodableKeyValuesPresent = (
	maybes: SerializableKeyValues,
): SerializableKeyValues =>
	Object.keys(maybes)
		.filter((key) => definedOrNonNull(maybes[key]))
		.reduce((result, key) => {
			result[key] = maybes[key]
			return result
		}, {} as SerializableKeyValues)

export const dsonEncodingMarker: DSONCodable = {
	encoding: (outputMode: OutputMode): CBOREncodableObject => {
		throw new Error(`impl me using ${outputMode}`)
	},
	toDSON: (outputMode?: OutputMode): Result<Buffer, Error> => {
		throw new Error(`impl me ${outputMode ? `using ${outputMode}` : ''}`)
	},
}

// eslint-disable-next-line max-lines-per-function
export const baseTokenDefinitionParticle = (
	input: TokenDefinitionParticleInput &
		Readonly<{
			specificEncodableKeyValues: SerializableKeyValues
			serializer: string
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
			const thisBaseBase = {
				radixParticleType: input.radixParticleType,
				name: notUndefinedOrCrash(resultList[1]),
				description: resultList[2],
				granularity: input.granularity ?? granularityDefault,
				resourceIdentifier: ResourceIdentifier.fromAddressAndName({
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
				...dsonEncodingMarker,
			}

			const keyValues = {
				...input.specificEncodableKeyValues,

				...encodableKeyValuesPresent({
					rri: thisBaseBase.resourceIdentifier,
					granularity: thisBaseBase.granularity,
					name: thisBaseBase.name,

					...keyValueIfPrimitivePresent({
						key: 'iconUrl',
						value: thisBaseBase.iconURL,
					}),
					...keyValueIfPrimitivePresent({
						key: 'url',
						value: thisBaseBase.url,
					}),
					...keyValueIfPrimitivePresent({
						key: 'description',
						value: thisBaseBase.description,
					}),
				}),
			}

			const thisBase = {
				...thisBaseBase,

				...JSONEncoding(input.serializer)(keyValues),

				...DSONEncoding(input.serializer)(keyValues),
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
	if (!isRadixParticle(something)) return false
	const inspection = something as TokenDefinitionParticleBase
	return (
		inspection.resourceIdentifier !== undefined &&
		inspection.granularity !== undefined &&
		inspection.name !== undefined
	)
}
