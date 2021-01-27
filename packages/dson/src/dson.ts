// @ts-ignore
import cbor, { CBOREncodablePrimitive } from 'cbor'
import {
	CBOREncodableObject,
	DSONCodable,
	DSONKeyValue,
	OutputMode,
} from './_types'
import { Result, err, ok } from 'neverthrow'

/**
 * Encodes some encodable object using CBOR. Overrides the default object encoding
 * to use stream encoding and lexicographical ordering of keys.
 *
 * @param data Object to encode
 */
export const encodeCbor = (
	data: CBOREncodableObject,
): Result<Buffer, Error> => {
	const encoder = new cbor.Encoder({
		highWaterMark: 90000,
		collapseBigIntegers: true,
	})

	try {
		const encoded = encoder._encodeAll([data])
		return ok(encoded)
	} catch (e) {
		return err(new Error(`CBOR encoding failed: ${e}`))
	}
}

/**
 * Helper method used by objects that should be DSON encodable.
 *
 * @param serializer The serializer value.
 * @param encodingMethodOrKeyValues A function specifying the DSON encoding, OR
 * a list of DSON encodable objects.
 */
export const DSONEncoding = (
	input: Readonly<{
		serializer?: string
		encodingMethodOrKeyValues:
			| (() => CBOREncodablePrimitive)
			| DSONKeyValue[]
	}>,
): DSONCodable => {
	if (Array.isArray(input.encodingMethodOrKeyValues)) {
		if (!input.serializer)
			throw new Error(
				'serializer required when supplying key values for DSON encoding.',
			)

		return DSONEncodableMap([
			...defaultKeyValues(input.serializer),
			...input.encodingMethodOrKeyValues,
		])
	}

	return DSONEncodableObject(input.encodingMethodOrKeyValues)
}

export const DSONPrimitive = (value: CBOREncodablePrimitive): DSONCodable => {
	if (isEmpty(value))
		throw new Error('DSON primitives cannot have an empty value.')

	return DSONEncoding({
		encodingMethodOrKeyValues: () => value,
	})
}

/**
 * DSON Encoding for a simple object. Such an object specifies an encoding function
 * for generating a CBOR encodable primitive.
 *
 * @param encodingFn A function that returns the primitive to be CBOR encoded.
 */
export const DSONEncodableObject = (
	encodingFn: () => CBOREncodablePrimitive,
): DSONCodable => {
	const encoding = () => ({
		encodeCBOR: (encoder: cbor.CBOREncoder) =>
			encoder.pushAny(encodingFn()),
	})

	return {
		encoding,
		toDSON: () => encodeCbor(encoding()),
	}
}

/**
 * DSON encoding for a complex type with several encodable objects.
 *
 * @param keyValues A list of DSON key value pairs.
 */
export const DSONEncodableMap = (keyValues: DSONKeyValue[]): DSONCodable => {
	const encoding = (outputMode: OutputMode) => ({
		encodeCBOR: (encoder: cbor.CBOREncoder) => {
			encoder.push(Buffer.from([0b1011_1111]))

			keyValues
				.filter((keyValue) =>
					allowsOutput(
						keyValue.outputMode ?? OutputMode.ALL,
						outputMode,
					),
				)
				.sort((keyValue1, keyValue2) =>
					keyValue1.key.localeCompare(keyValue2.key),
				)
				.map((keyValue) => {
					encoder.pushAny(keyValue.key)
					Array.isArray(keyValue.value)
						? encoder.pushAny(
								keyValue.value.map((codable) =>
									codable.encoding(outputMode),
								),
						  )
						: encoder.pushAny(keyValue.value.encoding(outputMode))
				})

			encoder.push(Buffer.from([0xff]))

			return true
		},
	})

	return {
		encoding,
		toDSON: (outputMode: OutputMode = OutputMode.ALL) =>
			encodeCbor(encoding(outputMode)),
	}
}

export const defaultKeyValues = (serializer: string): DSONKeyValue[] => [
	{
		key: 'serializer',
		value: DSONPrimitive(serializer),
	},
	{
		key: 'version',
		value: DSONPrimitive(100),
	},
]

const isEmpty = (val: any): boolean => {
	return (
		val === undefined ||
		val === null ||
		val.length === 0 ||
		(Object.keys(val).length === 0 && val.constructor === Object)
	)
}

const areDisjoint = (lhs: OutputMode, rhs: OutputMode): boolean => {
	return (lhs.valueOf() & rhs.valueOf()) === OutputMode.NONE.valueOf()
}

const intersects = (lhs: OutputMode, rhs: OutputMode): boolean => {
	return !areDisjoint(lhs, rhs)
}

const allowsOutput = (lhs: OutputMode, rhs: OutputMode): boolean =>
	intersects(lhs, rhs)
