import { err, ok } from 'neverthrow'
import {
	DSONPrimitive,
	DSONEncodableMap,
	DSONKeyValues,
	OutputMode,
} from '../src/dson'

import {
	JSONPrimitiveDecoder,
	JSONObjectDecoder,
	JSONEncoding,
	toJSON,
	JSONDecoding,
	primitiveDecoder,
	objectDecoder,
} from '../src/json'

import { serializerNotNeeded } from '../src/util'

const examples: Array<{
	name: string
	native: any
	json?: any
	dson?: Buffer
	dontDeserialize?: boolean
}> = []

// Primitives

// bool_false
examples.push({
	name: 'bool_false',
	native: false,
	json: false,
	dson: Buffer.from([0b1111_0100]),
})

// bool_true
examples.push({
	name: 'bool_true',
	native: true,
	json: true,
	dson: Buffer.from([0b1111_0101]),
})

// number
examples.push({
	name: 'number_10',
	native: 10,
	json: 10,
	dson: Buffer.from([0b0000_1010]),
})
examples.push({
	name: 'number_128',
	native: 128,
	json: 128,
	dson: Buffer.from([0b0001_1000, 0b1000_0000]),
})
examples.push({
	name: 'number_256',
	native: 256,
	json: 256,
	dson: Buffer.from([0b0001_1001, 0b0000_0001, 0b0000_0000]),
})
examples.push({
	name: 'number_500',
	native: 500,
	json: 500,
	dson: Buffer.from([0b0001_1001, 0b0000_0001, 0b1111_0100]),
})
examples.push({
	name: 'number_-1',
	native: -1,
	json: -1,
	dson: Buffer.from([0b0010_0000]),
})
examples.push({
	name: 'number_-500',
	native: -500,
	json: -500,
	dson: Buffer.from([0b0011_1001, 0b0000_0001, 0b1111_0011]),
})

// string
examples.push({
	name: 'string_a',
	native: 'a',
	json: ':str:a',
	dson: Buffer.from([0x61, 0x61]),
})

examples.push({
	name: 'string_Radix',
	native: 'Radix',
	json: ':str:Radix',
	dson: Buffer.from([0b0110_0101, 0x52, 0x61, 0x64, 0x69, 0x78]),
})

// sequence
examples.push({
	name: 'sequence_1,2,3,4',
	native: [1, 2, 3, 4],
	json: [1, 2, 3, 4],
	dson: Buffer.from([0b1000_0100, 0x01, 0x02, 0x03, 0x04]),
})

// map
examples.push({
	name: 'map_a:1,b:2',
	native: { a: 1, b: 2 },
	json: { a: 1, b: 2 },
	dson: Buffer.from([
		0b1011_1111,
		0b0110_0001,
		0x61,
		0x01,
		0b0110_0001,
		0x62,
		0x02,
		0xff,
	]),
})

// map
examples.push({
	name: 'map_a:1,b:2_exclude_undefined',
	native: { a: 1, b: 2, c: undefined },
	json: { a: 1, b: 2 },
	dson: Buffer.from([
		0b1011_1111,
		0b0110_0001,
		0x61,
		0x01,
		0b0110_0001,
		0x62,
		0x02,
		0xff,
	]),
	dontDeserialize: true,
})

examples.push({
	name: 'map_a:1,b:2_exclude_empty_array',
	native: { a: 1, b: 2, c: [] },
	json: { a: 1, b: 2 },
	dson: Buffer.from([
		0b1011_1111,
		0b0110_0001,
		0x61,
		0x01,
		0b0110_0001,
		0x62,
		0x02,
		0xff,
	]),
	dontDeserialize: true,
})

examples.push({
	name: 'map_a:1,b:2_exclude_empty_object',
	native: { a: 1, b: 2, c: {} },
	json: { a: 1, b: 2 },
	dson: Buffer.from([
		0b1011_1111,
		0b0110_0001,
		0x61,
		0x01,
		0b0110_0001,
		0x62,
		0x02,
		0xff,
	]),
	dontDeserialize: true,
})

examples.push({
	name: 'map_a:1,b:false',
	native: { a: 1, b: false },
	json: { a: 1, b: false },
	dson: Buffer.from([
		0b1011_1111,
		0b0110_0001,
		0x61,
		0x01,
		0b0110_0001,
		0x62,
		0b1111_0100,
		0xff,
	]),
	dontDeserialize: true,
})

describe('DSON encoding', () => {
	it('should encode DSON primitives', () => {
		examples
			.filter((example) => example.dson)
			.forEach((example) =>
				DSONPrimitive(example.native)
					.toDSON()
					.map((encoded) => {
						expect(encoded).toEqual(example.dson)
					}),
			)
	})

	it('should encode a map', () => {
		const serializationProps: DSONKeyValues = {
			a: DSONPrimitive(1),
			b: DSONPrimitive(2),
		}

		const { toDSON } = DSONEncodableMap(serializationProps)

		const result = toDSON()

		result.mapErr((Error) => {
			console.error(Error)
		})
		result.map((encoded) => {
			expect(encoded).toEqual(Buffer.from('bf616101616202ff', 'hex'))
		})
	})

	it('should encode a nested map', (done) => {
		const nestedProps = {
			a2: DSONPrimitive(3),
		}

		const serializationProps: DSONKeyValues = {
			a: DSONPrimitive(1),
			b: DSONEncodableMap(nestedProps),
		}

		const { toDSON } = DSONEncodableMap(serializationProps)

		const result = toDSON()

		result.map((encoded) => {
			expect(encoded).toEqual(
				Buffer.from('bf6161016162bf62613203ffff', 'hex'),
			)
			done()
		})
	})

	it('should encode a complex object', (done) => {
		const particle = DSONEncodableMap({
			particle: DSONEncodableMap({}),
			serializer: 'radix.spun_particle',
			spin: DSONPrimitive(1),
			version: 100,
		})

		const particleGroups = [
			DSONEncodableMap({
				particles: [particle, particle],
				serializer: DSONPrimitive('radix.particle_group'),
				version: DSONPrimitive(100),
			}),
		]

		const serializationProps: DSONKeyValues = {
			particleGroups,
			version: DSONPrimitive(100),
		}

		const { toDSON } = DSONEncodableMap(serializationProps)

		const result = toDSON()

		result.mapErr((Error) => {
			console.error(Error)
		})
		result.map((encoded) => {
			expect(encoded).toEqual(
				Buffer.from(
					'bf6e7061727469636c6547726f75707381bf697061727469636c657382bf687061727469636c65bfff6a73657269616c697a65727372616469782e7370756e5f7061727469636c65647370696e016776657273696f6e1864ffbf687061727469636c65bfff6a73657269616c697a65727372616469782e7370756e5f7061727469636c65647370696e016776657273696f6e1864ff6a73657269616c697a65727472616469782e7061727469636c655f67726f75706776657273696f6e1864ff6776657273696f6e1864ff',
					'hex',
				),
			)
			done()
		})
	})

	it('should only include key values with the specified output mode', (done) => {
		const nestedProps: DSONKeyValues = {
			a2: {
				value: 3,
				outputMode: OutputMode.HASH,
			},
		}

		const serializationProps: DSONKeyValues = {
			a: {
				value: 1,
				outputMode: OutputMode.API,
			},
			b: DSONEncodableMap(nestedProps),
		}

		const { toDSON } = DSONEncodableMap(serializationProps)

		const result = toDSON(OutputMode.HASH)

		result.map((encoded) => {
			expect(encoded).toEqual(Buffer.from('bf6162bf62613203ffff', 'hex'))
			done()
		})
	})
})

describe('JSON', () => {
	const serializer = 'test.object'
	const serializer2 = 'test.object2'

	const encodablePrimitive = (value: string) => ({
		value,
		...JSONEncoding(serializerNotNeeded)(() => `:tst:${value}`),
	})

	const encodableNestedComplex = (input: { prop1: number }) => {
		const jsonKeyValues = {
			prop1: input.prop1,
			prop2: encodablePrimitive('xyz'),
		}

		return {
			...JSONEncoding(serializer2)(jsonKeyValues),
		}
	}

	const encodableComplex = (input: {
		prop1: string
		prop2: string
		prop3: any
	}) => {
		const jsonKeyValues = {
			prop1: input.prop1,
			prop2: encodablePrimitive(input.prop2),
			prop3: input.prop3,
		}

		return {
			...JSONEncoding(serializer)(jsonKeyValues),
		}
	}

	describe('encoding', () => {
		it('should encode JSON primitives', () => {
			examples
				.filter((example) => example.json)
				.forEach((example) =>
					expect(toJSON(example.native)).toEqual(example.json),
				)
		})

		it('should encode a JSON object', () => {
			const encoded = encodableComplex({
				prop1: 'a',
				prop2: 'xyz',
				prop3: encodableNestedComplex({
					prop1: 0,
				}),
			})
				.toJSON()
				._unsafeUnwrap()

			const expected = {
				serializer: 'test.object',
				prop1: ':str:a',
				prop2: ':tst:xyz',
				prop3: {
					serializer: 'test.object2',
					prop1: 0,
					prop2: ':tst:xyz',
				},
			}

			expect(encoded).toEqual(expected)
		})
	})

	describe('decoding', () => {
		it('should decode JSON primitives', () => {
			const { fromJSON } = JSONDecoding()()
			examples
				.filter((example) => example.json)
				.filter((example) =>
					Object.keys(example.native).some(
						(key) => !example.native[key],
					),
				)
				.forEach((example) =>
					expect(fromJSON(example.json)._unsafeUnwrap()).toEqual(
						example.native,
					),
				)
		})

		it('should decode a JSON object', () => {
			const primitiveDecoders: JSONPrimitiveDecoder[] = [
				primitiveDecoder(':tst:', (data: string) =>
					ok(encodablePrimitive(data)),
				),
			]

			const objectDecoders: JSONObjectDecoder[] = [
				objectDecoder(
					serializer,
					(input: { prop1: string; prop2: string; prop3: any }) =>
						ok(encodableComplex(input)),
				),

				objectDecoder(serializer2, (input: { prop1: number }) =>
					ok(encodableNestedComplex(input)),
				),
			]

			const { fromJSON } = JSONDecoding()(
				...objectDecoders,
				...primitiveDecoders,
			)

			const json = {
				serializer,
				prop1: ':str:a',
				prop2: ':str:xyz',
				prop3: {
					serializer: serializer2,
					prop1: 0,
				},
			}

			const decoded = fromJSON(json)._unsafeUnwrap()

			const expected = encodableComplex({
				prop1: 'a',
				prop2: 'xyz',
				prop3: encodableNestedComplex({
					prop1: 0,
				}),
			})

			expect(JSON.stringify(decoded)).toEqual(JSON.stringify(expected))
		})

		it('should fail to decode with an unknown decoder', () => {
			const { fromJSON } = JSONDecoding()()

			const json = {
				a: ':tst:abc',
			}

			const decoded = fromJSON(json)
			expect(decoded.isErr()).toBe(true)
		})

		it('should fail to decode with an internal error', () => {
			const objectDecoders: JSONObjectDecoder[] = [
				objectDecoder(serializer, () =>
					err(Error('boom')),
				),
			]

			const { fromJSON } = JSONDecoding()(
				...objectDecoders,
			)

			const json = {
				serializer
			}

			const decoded = fromJSON(json)

			expect(decoded.isErr()).toEqual(true)
		})
	})
})
