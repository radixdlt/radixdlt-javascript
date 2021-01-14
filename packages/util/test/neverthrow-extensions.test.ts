import { Result, ok, combine } from 'neverthrow'

describe('result', () => {

	it('can use variadic generic combine', () => {
		const foo: Result<string, Error> = ok('Foo')
		const bar: Result<number, Error> = ok(1337)
		const buz: Result<boolean, Error> = ok(false)
		const biz: Result<number, Error> = ok(3.1415)

		const result = combine([
			foo,
			bar,
			buz,
			biz
		]).map((resultList) => ({
			foo: resultList[0],
			bar: resultList[1],
			buz: resultList[2],
			pi: resultList[3]
		}))

		expect(result._unsafeUnwrap()).toStrictEqual({
			foo: 'Foo',
			bar: 1337,
			buz: false,
			pi: 3.1415,
		})
	})
})
