import { Err, Ok, Result } from 'neverthrow'

/* eslint-disable */
declare module 'neverthrow' {
    interface Ok<T, E> {
        andThenMergeObject<U>(namedResult: {
            [key: string]: Result<U, E>
        }): Result<object, E>
        andThenMergeObjectNamedKey<U>(
            next: Result<U, E>,
            key?: string,
        ): Result<object, E>
    }

    interface Err<T, E> {
        andThenMergeObject<U>(namedResult: {
            [key: string]: Result<U, E>
        }): Result<object, E>
        andThenMergeObjectNamedKey<U>(
            next: Result<U, E>,
            key?: string,
        ): Result<object, E>
    }
}
Ok.prototype.andThenMergeObjectNamedKey = function <U, E>(
    next: Result<U, E>,
    key?: string,
): Result<object, E> {
    if (typeof this.value !== 'object') {
        throw new Error('Value is not an object, but is required.')
    }

    if (key) {
        return this.andThen((acc) =>
            next.map((nextValue) => ({ ...acc, [key]: nextValue })),
        )
    } else {
        return this.andThen((acc) =>
            next.map((nextValue) => ({ ...acc, nextValue })),
        )
    }
}

Ok.prototype.andThenMergeObject = function <U, E>(namedResult: {
    [key: string]: Result<U, E>
}): Result<object, E> {
    const keyForNextResult = Object.keys(namedResult)[0]
    const nextResult = namedResult[keyForNextResult]
    return this.andThenMergeObjectNamedKey(nextResult, keyForNextResult)
}

Err.prototype.andThenMergeObjectNamedKey = function <U, E>(
    next: Ok<U, E>,
    key?: string,
): Result<object, E> {
    return this.map((ignored) => ({}))
}

Err.prototype.andThenMergeObject = function <U, E>(namedResult: {
    [key: string]: Result<U, E>
}): Result<object, E> {
    return this.map((ignored) => ({}))
}


export * from 'neverthrow'

/* eslint-enable */
