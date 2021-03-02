import { err, ok, Result } from 'neverthrow'
import { flatten, mapObjIndexed } from 'ramda'
import {
	Decoder,
	FromJSONOutput,
	JSONDecodable,
	JSONDecodableObject,
	JSONDecodablePrimitive,
	JSONEncodable,
	JSONEncodableObject,
	JSONObjectDecoder,
	JSONPrimitiveDecoder,
	SERIALIZER,
	Tag,
} from './_types'

export const primitiveDecoder = (
	tag: string,
	decoder: (data: string) => Result<string | JSONEncodable, Error>,
): JSONPrimitiveDecoder => ({
	decoder: {
		[tag]: decoder,
	},
	type: Decoder.PRIMITIVE,
})

export const objectDecoder = (
	serializer: string,
	decoder: (input: any) => Result<JSONEncodable, Error>,
): JSONObjectDecoder => ({
	decoder: {
		[serializer]: decoder,
	},
	type: Decoder.OBJECT,
})

const defaultPrimitiveDecoders: JSONPrimitiveDecoder[] = [
	primitiveDecoder(Tag.STRING, (data: string) => ok(data)),
]

export const extractTag = (str: string): string => `:${str.split(':')[1]}:`

const fromJSONBasic = (
	...decoders: (JSONPrimitiveDecoder | JSONObjectDecoder)[]
) => <T>() => (json: JSONDecodablePrimitive): Result<T, Error> => {
	try {
		return ok(
			fromJSONRecursive(
				...(decoders.filter(
					(decoder) => decoder.type === Decoder.PRIMITIVE,
				) as JSONPrimitiveDecoder[]),
			)(
				...(decoders.filter(
					(decoder) => decoder.type === Decoder.OBJECT,
				) as JSONObjectDecoder[]),
			)(json) as any,
		)
	} catch (e) {
		return err(e)
	}
}

const fromJSONRecursive = (...primitiveDecoders: JSONPrimitiveDecoder[]) => (
	...objectDecoders: JSONObjectDecoder[]
) => (json: JSONDecodablePrimitive): FromJSONOutput => {
	const fromJSON = fromJSONRecursive(...primitiveDecoders)(...objectDecoders)

	const handleArray = (arr: JSONDecodablePrimitive[]): FromJSONOutput[] =>
		arr.map((item) => fromJSON(item))

	const handleObject = (
		json: JSONDecodableObject,
	): JSONEncodableObject | JSONEncodable => {
		if (json[SERIALIZER]) {
			const decoder = objectDecoders.find(
				(decoder) => decoder.decoder[json[SERIALIZER] as string],
			)

			if (!decoder)
				throw Error(
					`Missing object decoder for serializer ${
						json[SERIALIZER] as string
					}`,
				)

			const result = decoder.decoder[json[SERIALIZER] as string](
				mapObjIndexed(
					(value, key) =>
						key === SERIALIZER ? key : fromJSON(value),
					json,
				),
			)

			if (result.isOk()) {
				return result.value
			} else {
				throw result.error
			}
		}

		return mapObjIndexed((item) => fromJSON(item), json)
	}

	const handleString = (json: string): string | JSONEncodable => {
		const tag = extractTag(json)

		const decoder = primitiveDecoders.find(
			(decoder) => decoder.decoder[tag],
		)

		if (decoder) {
			const result = decoder.decoder[tag](json.slice(5))
			if (result.isOk()) return result.value
			throw result.error
		}
		throw Error(`No matching primitive decoding for string "${json}"`)
	}

	return Array.isArray(json)
		? handleArray(json)
		: typeof json === 'object'
		? handleObject(json)
		: typeof json === 'string'
		? handleString(json)
		: json
}

const fromJSONDefault = fromJSONBasic.bind(
	null,
	...(defaultPrimitiveDecoders as (
		| JSONPrimitiveDecoder
		| JSONObjectDecoder
	)[]),
)

export const JSONDecoding = <T>(...dependencies: JSONDecodable[]) => (
	...decoders: (JSONObjectDecoder | JSONPrimitiveDecoder)[]
) => {
	const decoders_ = [
		...flatten(dependencies.map((dep) => dep.JSONDecoders)),
		...decoders,
	]
	return {
		JSONDecoders: decoders_,
		fromJSON: fromJSONDefault(...decoders_)<T>(),
	}
}
