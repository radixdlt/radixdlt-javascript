import {
	DSONPrimitive,
	DSONEncodableMap,
	DSONKeyValue,
	OutputMode,
} from '../src/_index'

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

describe('DSON', () => {
	it('should encode DSON primitives', () => {
		for (const example of examples) {
			if (example.dson) {
				DSONPrimitive(example.native)
					.toDSON()
					.map((encoded) => {
						expect(encoded).toEqual(example.dson)
					})
			}
		}
	})

	it('should encode a map', () => {
		const serializationProps = [
			{
				key: 'a',
				value: DSONPrimitive(1),
			},
			{
				key: 'b',
				value: DSONPrimitive(2),
			},
		]

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
		const nestedProps = [
			{
				key: 'a2',
				value: DSONPrimitive(3),
			},
		]

		const serializationProps: DSONKeyValue[] = [
			{
				key: 'a',
				value: DSONPrimitive(1),
			},
			{
				key: 'b',
				value: DSONEncodableMap(nestedProps),
			},
		]

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
		const particle = DSONEncodableMap([
			{
				key: 'particle',
				value: DSONEncodableMap([]),
			},
			{
				key: 'serializer',
				value: DSONPrimitive('radix.spun_particle'),
			},
			{
				key: 'spin',
				value: DSONPrimitive(1),
			},
			{
				key: 'version',
				value: DSONPrimitive(100),
			},
		])

		const particleGroups = [
			DSONEncodableMap([
				{
					key: 'particles',
					value: [particle, particle],
				},
				{
					key: 'serializer',
					value: DSONPrimitive('radix.particle_group'),
				},
				{
					key: 'version',
					value: DSONPrimitive(100),
				},
			]),
		]

		const serializationProps: DSONKeyValue[] = [
			{
				key: 'particleGroups',
				value: particleGroups,
			},
			{
				key: 'version',
				value: DSONPrimitive(100),
			},
		]

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
		const nestedProps = [
			{
				key: 'a2',
				value: DSONPrimitive(3),
				outputMode: OutputMode.HASH,
			},
		]

		const serializationProps: DSONKeyValue[] = [
			{
				key: 'a',
				value: DSONPrimitive(1),
				outputMode: OutputMode.API,
			},
			{
				key: 'b',
				value: DSONEncodableMap(nestedProps),
			},
		]

		const { toDSON } = DSONEncodableMap(serializationProps)

		const result = toDSON(OutputMode.HASH)

		result.map((encoded) => {
			expect(encoded).toEqual(Buffer.from('bf6162bf62613203ffff', 'hex'))
			done()
		})
	})
})
