import { combine, err, ok, Result } from 'neverthrow'
import {
	JSONPrimitiveDecoder,
	JSONEncodable,
	JSONEncodablePrimitive,
	SERIALIZER,
	Tag,
	JSONObjectDecoder,
	JSONKeyValues,
	FromJSONOutput,
	JSONDecodableObject,
	JSONEncodableObject,
	JSONDecodablePrimitive,
} from './_types'

const defaultPrimitiveDecoders: JSONPrimitiveDecoder[] = [
	{
		[Tag.STRING]: (data) => ok(data),
	},
]

export const extractTag = (str: string): string => `:${str.split(':')[1]}:`

export const toJSON = (
	data: JSONEncodablePrimitive | JSONEncodable | JSONKeyValues,
): JSONEncodablePrimitive => {
	if (data === undefined || data === null) return

	if (Array.isArray(data)) return data.map((item) => toJSON(item))

	switch (typeof data) {
		case 'number':
		case 'boolean':
			return data
		case 'bigint':
			return data.toString()
		case 'string':
			return `${Tag.STRING}${data}`
		case 'object': {
			return Object.keys(data).reduce((result: any, key) => {
				if (typeof data.toJSON === 'function') return data.toJSON()

				const json = toJSON(
					(data as { [key: string]: JSONEncodablePrimitive })[key],
				)

				if (!isEmpty(json)) {
					result[key] = json
				}

				return result
			}, {} as { [key: string]: JSONEncodablePrimitive })
		}
		default:
			throw Error('JSON error: unsupported type.')
	}
}

export const JSONEncoding = <Serializer extends string | undefined>(
	serializer?: Serializer,
) => (
	encodingMethodOrKeyValues: Serializer extends string
		? JSONKeyValues
		: () => JSONEncodablePrimitive,
): JSONEncodable => {
	if (typeof encodingMethodOrKeyValues !== 'function') {
		if (!serializer)
			throw new Error(
				'serializer required when supplying key values for JSON encoding.',
			)

		return {
			toJSON: () => ({
				serializer: serializer as string,
				...(toJSON(encodingMethodOrKeyValues as JSONKeyValues) as {
					[key: string]: JSONEncodablePrimitive
				}),
			}),
		}
	}

	return {
		toJSON: encodingMethodOrKeyValues as () => JSONEncodablePrimitive,
	}
}

const fromJSONBasic = (...primitiveDecoders: JSONPrimitiveDecoder[]) => (
	...objectDecoders: JSONObjectDecoder[]
) => (json: JSONDecodablePrimitive): FromJSONOutput => {
	const fromJSON = fromJSONBasic(...primitiveDecoders)(...objectDecoders)

	const handleArray = (arr: JSONDecodablePrimitive[]): FromJSONOutput[] =>
		arr.map((item) =>
			fromJSONBasic(...primitiveDecoders)(...objectDecoders)(item),
		)

	const handleObject = (
		json: JSONDecodableObject,
	): JSONEncodableObject | JSONEncodable => {
		if (json[SERIALIZER]) {
			const decoder = objectDecoders.find(
				(decoder) => decoder[json[SERIALIZER] as string],
			)

			if (!decoder)
				throw Error(
					`Missing object decoder for serializer ${
						json[SERIALIZER] as string
					}`,
				)

			const result = decoder[json[SERIALIZER] as string]({
				...Object.keys(json).reduce((result, key) => {
					if (key === SERIALIZER) return result
					result[key] = fromJSON(json[key])
					return result
				}, {} as any),
			})
			if (result.isOk()) {
				return result.value
			} else {
				throw result.error
			}
		}

		return Object.keys(json).reduce((result, key) => {
			result[key] = fromJSON(json[key])
			return result
		}, {} as any)
	}

	const handleString = (json: string): string | JSONEncodable => {
		const tag = extractTag(json)

		const decoder = primitiveDecoders.find((decoder) => decoder[tag])

		if (decoder) {
			const result = decoder[tag](json.slice(5))
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

export const fromJSONDefault = fromJSONBasic.bind(
	null,
	...defaultPrimitiveDecoders,
)

export function isEmpty(val: JSONEncodablePrimitive): boolean {
	return (
		val === undefined ||
		val === null ||
		(Array.isArray(val) && val.length === 0) ||
		(Object.keys(val).length === 0 && val.constructor === Object)
	)
}
