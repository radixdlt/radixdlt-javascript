import { err, ok, Result } from 'neverthrow'
import { flatten, mapObjIndexed, pipe } from 'ramda'
import {
	isObject,
	isString,
	flattenResultsObject,
	isArray,
	isBoolean,
	isNumber,
	isResult,
} from '@radixdlt/util'
import { JSONDecodable, Decoder, SERIALIZER } from './_types'

const decoder = <T>(
	algorithm: (value: unknown, key?: string) => Result<T, Error> | undefined,
): Decoder => (value: unknown, key?: string) => algorithm(value, key)

export const tagDecoder = (tag: string) => <T>(
	algorithm: (value: string) => Result<T, Error>,
): Decoder =>
	decoder<T>((value) =>
		isString(value) && `:${value.split(':')[1]}:` === tag
			? algorithm(value.slice(tag.length))
			: undefined,
	)

export const serializerDecoder = (serializer: string) => <T>(
	algorithm: (value: T) => Result<unknown, Error>,
): Decoder =>
	decoder((value) =>
		isObject(value) && value[SERIALIZER] && value[SERIALIZER] === serializer
			? algorithm(value as T)
			: undefined,
	)

export const stringTagDecoder = tagDecoder(':str:')((value) => ok(value))

const applyDecoders = (
	decoders: Decoder[],
	value: unknown,
	key?: string,
): Result<unknown, Error> => {
	let unwrappedValue: unknown

	if (isResult(value)) {
		if (value.isOk()) {
			unwrappedValue = value.value
		} else {
			return value
		}
	} else {
		unwrappedValue = value
	}

	const results = decoders
		.map((decoder) => decoder(unwrappedValue, key))
		.filter((result) => result !== undefined)

	if (results.length > 1)
		return err(
			Error(
				`JSON decoding failed. Several decoders were valid for key/value pair. 
        This can lead to unexpected behavior.`,
			),
		)

	return results[0] ? results[0] : ok(unwrappedValue)
}

const defaultDecoders = [stringTagDecoder]

export const JSONDecode = <T>(...decoders: Decoder[]) => (
	json: unknown,
): Result<T, Error[]> => {
	const decode = JSONDecodeUnflattened(...defaultDecoders, ...decoders)

	return pipe(
		applyDecoders.bind(null, decoders),
		flattenResultsObject,
	)(decode(json)) as Result<T, Error[]>
}

export const JSONDecodeUnflattened = (...decoders: Decoder[]) => (
	json: unknown,
): Result<unknown, Error[]> =>
	isObject(json)
		? flattenResultsObject(
				ok(
					mapObjIndexed(
						(value, key) =>
							applyDecoders(
								decoders,
								JSONDecodeUnflattened(...decoders)(value),
								key,
							),
						json,
					),
				),
		  )
		: isString(json)
		? applyDecoders(decoders, json).mapErr((err) => [err])
		: isArray(json)
		? ok(json.map((item) => JSONDecodeUnflattened(...decoders)(item)))
		: isBoolean(json)
		? ok(json)
		: isNumber(json)
		? ok(json)
		: err([Error('JSON decoding failed. Unknown data type.')])

export const JSONDecoding = <T>(...dependencies: JSONDecodable[]) => (
	...decoders: Decoder[]
): JSONDecodable => {
	const decoders_ = [
		...flatten(dependencies.map((dep) => dep.JSONDecoders)),
		...decoders,
	]
	return {
		JSONDecoders: decoders_,
		fromJSON: JSONDecode<T>(...decoders_),
	}
}
