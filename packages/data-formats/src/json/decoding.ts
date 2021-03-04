import { err, ok, Result } from "neverthrow"
import { flatten, mapObjIndexed, pipe } from "ramda"
import { isObject, isString, flattenNestedResults, isArray, isBoolean, isNumber, isResult } from '@radixdlt/util'
import { JSONDecodable, DecodingFn, Decoder, SERIALIZER } from './_types'

const decoder = <T>(algorithm: (value: unknown, decodingContext: DecodingFn, key?: string) => Result<T, Error> | undefined): Decoder => (value: unknown, decodingContext: DecodingFn, key?: string) => algorithm(value, decodingContext, key)

export const tagDecoder = (tag: string) => <T>(algorithm: (value: string) => Result<T, Error>) => decoder<T>(
    value =>
        isString(value) && (`:${value.split(':')[1]}:` === tag)
        ? algorithm(value.split(':')[2])
        : undefined
)

export const serializerDecoder = (serializer: string) => <T>(algorithm: (value: T) => Result<unknown, Error>) => decoder(
    (value, decodingContext) =>
        isObject(value) && value[SERIALIZER] && value[SERIALIZER] === serializer
        ? decodingContext(value)
            .map(value => algorithm(value as T))
            .andThen(value => value as any)
            .mapErr(err => err as any)
        : undefined
)

export const stringTagDecoder = tagDecoder(':str:')(value => ok(value))

const applyDecoders = (decoders: Decoder[], value: unknown, decodingContext: DecodingFn, key?: string) => {
    const results = decoders.map(decoder => decoder(value, decodingContext, key)).filter(result => result !== undefined)

    if(results.length > 1) return err(Error(
        `JSON decoding failed. Several decoders were valid for key/value pair. 
        This can lead to unexpected behavior.`
    ))

    return results[0]
        ? results[0]
        : value
}

const defaultDecoders = [stringTagDecoder]

export const JSONDecode = <T>(...decoders: Decoder[]) => (json: unknown): Result<T, Error[]> => {
    const decode = JSONDecodeUnflattened(...defaultDecoders, ...decoders)

    return pipe(
        decode,
        flattenNestedResults
    )(
        applyDecoders(decoders, json, decode)
    ) as Result<T, Error[]>
}

export const JSONDecodeUnflattened = (...decoders: Decoder[]) => (json: unknown): Result<unknown, Error[]> => 
    isObject(json) 
        ? flattenNestedResults(ok(mapObjIndexed(
            (value, key) => applyDecoders(decoders, value, JSONDecodeUnflattened(...decoders), key), 
            json
        )))
    : isString(json)
        ? ok(applyDecoders(decoders, json, JSONDecodeUnflattened(...decoders)))
    : isArray(json)
        ? ok(json.map(item => JSONDecodeUnflattened(...decoders)(item)))
    : isBoolean(json)
        ? ok(json)
    : isNumber(json)
        ? ok(json)
    : isResult(json)
        ? json.isOk()
            ? JSONDecodeUnflattened(...decoders)(json.value)
            : err([json.error])
    : err([Error('JSON decoding failed. Unknown data type.')])



export const JSONDecoding = <T>(...dependencies: JSONDecodable[]) => (
    ...decoders: Decoder[]
) => {
    const decoders_ = [
        ...flatten(dependencies.map((dep) => dep.JSONDecoders)),
        ...decoders,
    ]
    return {
        JSONDecoders: decoders_,
        fromJSON: JSONDecode<T>(...decoders_),
    }
}