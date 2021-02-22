import { err, ok, Result } from 'neverthrow'
import { isEmpty } from './util'
import {
	JSONDecodablePrimitive,
	JSONEncodable,
	JSONEncodablePrimitive,
	JSONKeyValues,
	Tag,
} from './_types'

export const toJSON = (
	data: JSONEncodablePrimitive | JSONEncodable | JSONKeyValues,
): JSONDecodablePrimitive => {
	if (data === undefined || data === null) return

	if (Array.isArray(data)) return data.map((item) => toJSON(item))

	switch (typeof data) {
		case 'number':
		case 'boolean':
			return data
		case 'string':
			return `${Tag.STRING}${data}`
		case 'object': {
			return Object.keys(data).reduce((result: any, key) => {
				if (typeof data.toJSON === 'function') {
					const result = data.toJSON()
					if (result.isOk()) {
						return result.value
					}
					throw result.error
				}

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
			toJSON: () => {
				let tojson: {
					[key: string]: JSONEncodablePrimitive
				}

				try {
					tojson = toJSON(
						encodingMethodOrKeyValues as JSONKeyValues,
					) as {
						[key: string]: JSONEncodablePrimitive
					}
				} catch (e) {
					return err(e)
				}

				return ok({
					serializer: serializer as string,
					...tojson,
				})
			},
		}
	}

	return {
		toJSON: () =>
			ok((encodingMethodOrKeyValues as () => JSONDecodablePrimitive)()),
	}
}
