import { err, ok, Result } from "neverthrow"
import { flatten, mapObjIndexed, pipe } from "ramda"
import { isObject, isString, flattenNestedResults, isArray, isBoolean, isNumber } from '@radixdlt/util'
import { JSONDecodable, DecodingFn, Decoder } from './_types'

const decoder = <T>(algorithm: (value: unknown, decodingContext: DecodingFn, key?: string) => Result<T, Error>): Decoder => (value: unknown, decodingContext: DecodingFn, key?: string) => algorithm(value, decodingContext, key)

export const tagDecoder = (tag: string) => <T>(algorithm: (value: string) => Result<T, Error>) => decoder<T>(
    value =>
        !isString(value)
            ? err(Error('Tag decoding failed. Value was not a string.'))
        : !(`:${value.split(':')[1]}:` === tag)
            ? err(Error('Tag decoding failed. Tag mismatch.'))
        : algorithm(value.split(':')[2])
)

export const serializerDecoder = (serializer: string) => <T>(algorithm: (value: T) => Result<unknown, Error>) => decoder(
    (value, decodingContext) =>
        !isObject(value)
            ? err(Error('Serializer decoding failed. Value was not an object.'))
        : !value['serializer']
            ? err(Error('Serializer decoding failed. No \'serializer\' prop found.'))
        : value['serializer'] !== serializer
            ? err(Error('Serializer decoding failed. Serializer mismatch.'))
        : decodingContext(value).map(value => algorithm(value as T)).andThen(value => value).mapErr(err => err)
)

export const stringTagDecoder = tagDecoder(':str:')(value => ok(value))

const applyDecoders = (decoders: Decoder[], value: unknown, decodingContext: DecodingFn, key?: string) => {
    const results = decoders.map(decoder => decoder(value, decodingContext, key)).filter(result => result.isOk())

    if(results.length > 1) return err(Error(
        `JSON decoding failed. Several decoders were valid for key/value pair. 
        This can lead to unexpected behavior.`
    ))

    return results[0] && results[0].isOk()
        ? results[0].value
        : value
}

const defaultDecoders = [stringTagDecoder]

export const JSONDecode =  <T>(...decoders: Decoder[]) => (json: unknown): Result<T, Error[]> => {
    const decode = JSONDecodeUnflattened(...defaultDecoders, ...decoders)

    return pipe(
        decode,
        flattenNestedResults
    )(
        applyDecoders(decoders, json, decode)
    ) as Result<T, Error[]>
}

export const JSONDecodeUnflattened = (...decoders: Decoder[]) => (json: unknown): Result<unknown, Error> => 
    isObject(json) 
        ? ok(mapObjIndexed(
            (value, key) => applyDecoders(decoders, value, JSONDecodeUnflattened(...decoders), key), 
            json
        ))
    : isString(json)
        ? ok(applyDecoders(decoders, json, JSONDecodeUnflattened(...decoders)))
    : isArray(json)
        ? ok(json.map(item => JSONDecodeUnflattened(...decoders)(item)))
    : isBoolean(json)
        ? ok(json)
    : isNumber(json)
        ? ok(json)
    : err(Error('JSON decoding failed. Unknown data type.'))



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