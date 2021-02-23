import { DSONEncoding, DSONPrimitive } from './dson'
import { DSONCodable, DSONKeyValues, OutputMode } from './_types'
import { Byte, byteToBuffer } from '@radixdlt/util'

export const DSONObjectEncoding = (input: {
	prefix: Byte
	buffer: Buffer
}): DSONCodable =>
	DSONEncoding(undefined)(() =>
		Buffer.concat([byteToBuffer(input.prefix), input.buffer]),
	)

export const hasOutputMode = (
	any: unknown,
): any is {
	value: DSONCodable | DSONCodable[]
	outputMode: OutputMode
} => {
	return (any as { outputMode: OutputMode }).outputMode ? true : false
}

export const isDSONCodable = (
	any: unknown,
): any is DSONCodable | DSONCodable[] =>
	typeof (any as DSONCodable).toDSON === 'function' || Array.isArray(any)

export const formatKeyValues = (
	keyValues: DSONKeyValues,
): {
	[key: string]:
		| DSONCodable
		| DSONCodable[]
		| { value: DSONCodable | DSONCodable[]; outputMode: OutputMode }
} => {
	const formatted: {
		[key: string]:
			| DSONCodable
			| DSONCodable[]
			| { value: DSONCodable | DSONCodable[]; outputMode: OutputMode }
	} = {}

	for (const key in keyValues) {
		const value = keyValues[key]
		formatted[key] = isDSONCodable(value)
			? value
			: hasOutputMode(value)
			? isDSONCodable(value.value)
				? value
				: {
						value: DSONPrimitive(value.value),
						outputMode: value.outputMode,
				  }
			: DSONPrimitive(value)
	}
	return formatted
}
