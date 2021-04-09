import { isString } from '@radixdlt/util'
import { Err, err, ok } from 'neverthrow'
import { decoder, JSONDecoding } from '../src/json'

describe('JSON decoding', () => {
	it('should decode an array', () => {
		const { fromJSON } = JSONDecoding.create()

		const json = [
			{
				a: 'a'
			},
			{
				b: 'b'
			}
		]

		const expected = json

		const decoded = fromJSON(json)._unsafeUnwrap()

		expect(JSON.stringify(decoded)).toEqual(JSON.stringify(expected))

	})

	it('should decode an array', () => {
		const { fromJSON } = JSONDecoding.create()

		const json = [
			{
				a: 'a'
			},
			{
				b: 'b'
			}
		]

		const expected = json

		const decoded = fromJSON(json)._unsafeUnwrap()

		expect(JSON.stringify(decoded)).toEqual(JSON.stringify(expected))
	})

	it('should decode strings, booleans and numbers', () => {
		const { fromJSON } = JSONDecoding.create()

		const str = 'string'
		const bool = true
		const nbr = 1

		const expected = json

		const decoded = fromJSON(json)._unsafeUnwrap()

		expect(JSON.stringify(decoded)).toEqual(JSON.stringify(expected))
	})

	it('should decode using string decoders', () => {
		const decodedValue = 'decoded'

		const stringDecoder = decoder((value, key) =>
			key !== undefined && isString(value) && value === 'decodeMe'
				? ok(value + decodedValue)
				: undefined
		)

		const stringDecoder2 = decoder((value, key) =>
			key !== undefined && isString(value) && value === 'decodeMe2'
				? ok(value + decodedValue)
				: undefined
		)

		const { fromJSON } = JSONDecoding.withDecoders(
			stringDecoder,
			stringDecoder2
		).create()

		const json = {
			prop1: 'a',
			prop2: 'decodeMe',
			prop3: {
				prop1: 'decodeMe2',
			},
		}

		const decoded = fromJSON(json)._unsafeUnwrap()

		const expected = {
			prop1: 'a',
			prop2: json.prop2 + decodedValue,
			prop3: {
				prop1: json.prop3.prop1 + decodedValue,
			}
		}

		expect(JSON.stringify(decoded)).toEqual(JSON.stringify(expected))
	})

	it('should fail and return all errors', () => {
		const decodedValue = 'decoded'
		const errorMsg1 = 'boom'
		const errorMsg2 = 'boom2'


		const stringDecoder = decoder((value, key) =>
			key !== undefined && isString(value) && value === 'decodeMe'
				? err(Error(errorMsg1))
				: undefined
		)

		const stringDecoder2 = decoder((value, key) =>
			key !== undefined && isString(value) && value === 'decodeMe2'
				? err(Error(errorMsg2))
				: undefined
		)

		const stringDecoder3 = decoder((value, key) =>
			key !== undefined && isString(value) && value === 'decodeMe3'
				? ok(value + decodedValue)
				: undefined
		)

		const { fromJSON } = JSONDecoding.withDecoders(
			stringDecoder,
			stringDecoder2,
			stringDecoder3
		).create()

		const json = {
			prop1: 'decodeMe',
			prop2: 'decodeMe2',
			prop3: {
				prop1: 'decodeMe3',
			},
		}

		const decoded = fromJSON(json)

		expect(decoded.isErr()).toEqual(true)
		expect((decoded as Err<unknown, Error[]>).error.length).toEqual(2)
		expect((decoded as Err<unknown, Error[]>).error[0].message).toEqual(errorMsg1)
		expect((decoded as Err<unknown, Error[]>).error[1].message).toEqual(errorMsg2)
	})
})

