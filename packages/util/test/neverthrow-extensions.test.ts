import { Ok, ok, Result, Err } from 'neverthrow'

declare module 'neverthrow' {
	export interface Ok<T, E> {
		andThenMergeObject<U>(namedResult: {
			[key: string]: Result<U, E>
		}): Result<object, E>
		andThenMergeObjectNamedKey<U>(
			next: Result<U, E>,
			key?: string,
		): Result<Object, E>
	}

	export interface Err<T, E> {
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

describe('result', () => {
	it('cannot merge results which type is not object', () => {
		const biz: Result<number, Error> = ok(3.1415)

		expect(() => {
			ok(1337).andThenMergeObject({ biz })
		}).toThrow('Value is not an object, but is required.')
	})

	it('can merge object with result', () => {
		const foo: Result<string, Error> = ok('Foo')
		const bar: Result<number, Error> = ok(1337)
		const buz: Result<boolean, Error> = ok(false)
		const biz: Result<number, Error> = ok(3.1415)

		const result = ok({ base: true })
			.andThenMergeObjectNamedKey(foo, 'foo')
			.andThenMergeObject({ bar })
			.andThenMergeObject({ buz: buz })
			.andThenMergeObject({ pi: biz })

		expect(result._unsafeUnwrap()).toStrictEqual({
			base: true,
			foo: 'Foo',
			bar: 1337,
			buz: false,
			pi: 3.1415,
		})
	})
})
