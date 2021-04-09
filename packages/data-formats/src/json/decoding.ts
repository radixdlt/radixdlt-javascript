import { combine, err, ok, Result } from 'neverthrow'
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
import { JSONDecodable, Decoder } from './_types'

/**
 * Creates a new decoder. A decoder defines a way to transform a key-value pair through a
 * supplied algorithm.
 */
export const decoder = <T>(
	algorithm: (value: unknown, key?: string) => Result<T, Error> | undefined,
): Decoder => (value: unknown, key?: string) => algorithm(value, key)

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

	return results.length > 1
		? err(
			Error(
				`JSON decoding failed. Several decoders were valid for key/value pair. 
                    This can lead to unexpected behavior.`,
			),
		)
		: results[0]
			? results[0]
			: ok(unwrappedValue)
}

const JSONDecode = <T>(...decoders: Decoder[]) => (
	json: unknown,
): Result<T, Error[]> => {
	const decode = JSONDecodeUnflattened(...decoders)

	return pipe(
		//applyDecoders.bind(null, decoders),
		flattenResultsObject,
	)(decode(json)) as Result<T, Error[]>
}

/**
 * Main decoding logic. Uses the registered decoders and applies matching decoders to
 * all key-value pairs in the supplied JSON.
 */
const JSONDecodeUnflattened = (...decoders: Decoder[]) => (
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
		: isString(json) || isBoolean(json) || isNumber(json)
			? applyDecoders(decoders, json).mapErr((err) => [err])
			: isArray(json)
				? combine(
					json.map((item) =>
						JSONDecodeUnflattened(...decoders)(item),
					),
				).mapErr((err) => err)
				: err([Error('JSON decoding failed. Unknown data type.')])

/**
 * Adds JSON decoding to a decodable entity.
 *
 * @param dependencies JSON decodables that the resulting entity depends on.
 * This is needed to register all the necessary decoders from the dependencies (see exported "decoder" method).
 *
 * @param decoders Decoders needed to perform the decoding.
 * @returns A JSONDecodable entity of type T.
 */
const withDecoding = <T>(decoders: Decoder[]): JSONDecodable<T> => ({
	JSONDecoders: decoders,
	fromJSON: JSONDecode<T>(...decoders),
})

const withDecoders = (...decoders: Decoder[]) => ({
	create: <T>() => withDecoding<T>(decoders),
})

const withDependencies = (...dependencies: JSONDecodable<unknown>[]) => {
	const decoders = [...flatten(dependencies.map((dep) => dep.JSONDecoders))]

	return {
		create: <T>() => withDecoding<T>(decoders),
		withDecoders: withDecoders.bind(null, ...decoders),
	}
}

export const JSONDecoding = {
	withDependencies,
	withDecoders,
	create: <T>() => withDecoding<T>([]),
}
