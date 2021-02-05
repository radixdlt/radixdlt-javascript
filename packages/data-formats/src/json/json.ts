import {
	JSONPrimitiveDecoder,
	JSONEncodable,
	JSONEncodablePrimitive,
	SERIALIZER,
	Tag,
	JSONObjectDecoder,
} from './_types'

const defaultPrimitiveDecoders: JSONPrimitiveDecoder[] = [
	{
		[Tag.STRING]: (data) => data,
	},
]

export const extractTag = (str: string): string => `:${str.split(':')[1]}:`

export const toJSON = (
	data: JSONEncodablePrimitive | JSONEncodable,
): JSONEncodablePrimitive => {
	if (data === undefined || data === null) return data

	if (Array.isArray(data)) return data.map((item) => toJSON(item))

	switch (typeof data) {
		case 'number':
		case 'boolean':
			return data
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
		? { [key: string]: JSONEncodablePrimitive | JSONEncodable }
		: () => JSONEncodablePrimitive,
): JSONEncodable => {
	if (typeof encodingMethodOrKeyValues !== 'function') {
		if (!serializer)
			throw new Error(
				'serializer required when supplying key values for DSON encoding.',
			)

		return {
			toJSON: () => ({
				serializer: serializer as string,
				...(toJSON(encodingMethodOrKeyValues as any) as Record<
					string,
					unknown
				>),
			}),
		}
	}

	return {
		toJSON: encodingMethodOrKeyValues as () => JSONEncodablePrimitive,
	}
}

const fromJSONBasic = (...primitiveDecoders: JSONPrimitiveDecoder[]) => (
	...objectDecoders: JSONObjectDecoder[]
) => (json: JSONEncodablePrimitive): JSONEncodablePrimitive => {
	if (Array.isArray(json))
		return json.map((item) =>
			fromJSONBasic(...primitiveDecoders)(...objectDecoders)(item),
		)

	switch (typeof json) {
		case 'object': {
			const output = Object.keys(json).reduce((result, key) => {
				result[key] =
					key === SERIALIZER
						? json[key]
						: fromJSONBasic(...primitiveDecoders)(
								...objectDecoders,
						  )(json[key])
				return result
			}, {} as Record<string, JSONEncodablePrimitive>)

			const objectDecoder = objectDecoders.find(
				(decoder) => decoder[output[SERIALIZER] as string],
			)

			return objectDecoder
				? objectDecoder[output[SERIALIZER] as string](output)
				: output
		}
		case 'string': {
			const tag = extractTag(json)

			const decoder = primitiveDecoders.filter(
				(decoder) => decoder[tag],
			)[0]
			if (decoder) return decoder[tag](json.slice(5))

			throw new Error(
				`No matching primitive decoding for string "${json}"`,
			)
		}
		default:
			return json
	}
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
