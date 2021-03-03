import { err, ok, Result } from "neverthrow"
import { mapObjIndexed } from "ramda"

const isT = <T>(validate: (value: unknown) => boolean) => (value: unknown): value is T => validate(value)

const isString = isT<string>(value => typeof value === 'string')

const isObject = isT<Record<string, unknown>>(value => typeof value === 'object' && !Array.isArray(value) && !isResult(value))

const isArray = isT<Array<unknown>>(value => Array.isArray(value))

const isBoolean = isT<boolean>(value => typeof value === 'boolean')

const isNumber = isT<number>(value => typeof value === 'number')

const isResult = isT<Result<unknown, Error>>(value => (value as any)._unsafeUnwrap ? true : false)

type Decoder = (key: string, value: unknown, decodingContext: DecodingFn) => Result<unknown, Error>

type DecodingFn = <T>(json: T) => Result<unknown, Error>

const decode = <T>(algorithm: (key: string, value: unknown, decodingContext: DecodingFn) => Result<T, Error>): Decoder => (key: string, value: unknown, decodingContext: DecodingFn) => algorithm(key, value, decodingContext)

export const tagDecode = (tag: string) => <T>(algorithm: (value: string) => Result<T, Error>) => decode<T>(
    (_, value) =>
        !isString(value)
            ? err(Error('Tag decoding failed. Value was not a string.'))
        : !(`:${value.split(':')[1]}:` === tag)
            ? err(Error('Tag decoding failed. Tag mismatch.'))
        : algorithm(value.split(':')[2])
)

export const serializerDecode = (serializer: string) => <T>(algorithm: (value: T) => Result<unknown, Error>) => decode(
    (_, value, decodingContext) =>
        !isObject(value)
            ? err(Error('Serializer decoding failed. Value was not an object.'))
        : !value['serializer']
            ? err(Error('Serializer decoding failed. No \'serializer\' prop found.'))
        : value['serializer'] !== serializer
            ? err(Error('Serializer decoding failed. Serializer mismatch.'))
        : decodingContext(value).map(value => algorithm(value as T)).andThen(value => value).mapErr(err => err)
)

export const stringTagDecode = tagDecode(':str:')(value => ok(value))

const applyDecoders = (decoders: Decoder[], key: string, value: unknown, decodingContext: <T>(json: T) => Result<unknown, Error>) => {
    const results = decoders.map(decoder => decoder(key, value, decodingContext)).filter(result => result.isOk())

    if(results.length > 1) throw Error(
        `JSON decoding failed. Several decoders were valid for key/value pair. 
        This can lead to unexpected behavior.`
    )

    return results[0] && results[0].isOk()
        ? results[0].value
        : value
}

const flattenNestedResults = (json: unknown): Result<unknown, Error[]> => {
    let errors: Error[] = [] 

    const unpackResult = (item: unknown) => {
        if (isResult(item)) {
            if(item.isOk()) {
                const value = item.value
                return isObject(value) ? flattenNestedResults(value) : value
            }
            errors.push(item.error)
        }
        return item
    }
   
    const flattened = 
        isResult(json)
            ? json.isErr()
                ? unpackResult(json)
                : flattenNestedResults(json.value)
        : isObject(json) 
            ? mapObjIndexed(
                    item => unpackResult(item),
                    json
                )
        : isString(json)
            ? unpackResult(json)
        : isArray(json) 
            ? json.map(item => unpackResult(item))
        : isBoolean(json)
            ? unpackResult(json)
        : isNumber(json)
            ? unpackResult(json)
        : err(Error('Failed to flatten result from decoding. Unknown type.'))
    
    return errors.length > 0 
        ? err(errors)
        : isResult(flattened)
            ? flattened.isOk()
                ? flattened
                : err([flattened.error]) as any
            : ok(flattened)
        
}

export const JSONDecode = (...decoders: Decoder[]) => <T>(json: T): any => flattenNestedResults(
    JSONDecodeUnflattened(
        stringTagDecode, ...decoders
    )(
        {
            a: json
        }
    )
)


export const JSONDecodeUnflattened = (...decoders: Decoder[]) => <T>(json: T): any => 
    isObject(json) 
        ? ok(mapObjIndexed(
            (value, key) => applyDecoders(decoders, key, value, JSONDecodeUnflattened(...decoders)), 
            json
        ))
    : isString(json)
        ? ok(applyDecoders(decoders, 'null', json, JSONDecodeUnflattened(...decoders)))
    : isArray(json)
        ? ok(json.map(item => JSONDecodeUnflattened(...decoders)(item)))
    : isBoolean(json)
        ? ok(json)
    : isNumber(json)
        ? ok(json)
    : err(Error('JSON decoding failed. Unknown data type.'))


