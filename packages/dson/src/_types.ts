// @ts-ignore
import cbor from 'cbor'
import { Result } from 'neverthrow'

export type DSONCodable = {
	encoding: (outputMode: OutputMode) => CBOREncodableObject
} & Readonly<{
	toDSON: (outputMode?: OutputMode) => Result<Buffer, Error>
}>

export type CBOREncodableObject = Readonly<{
	encodeCBOR: (encoder: cbor.CBOREncoder) => boolean
}>

export type DSONKeyValue = Readonly<{
	key: string
	value: DSONCodable | DSONCodable[]
	outputMode?: OutputMode
}>

export type CBOREncodablePrimitive = string | number | boolean | Buffer | BigInt

export enum OutputMode {
	NONE = 0,
	HASH = 1 << 0,
	API = 1 << 1,
	WIRE = 1 << 2,
	PERSIST = 1 << 3,

	ALL = HASH | API | WIRE | PERSIST,
	ALL_BUT_HASH = API | WIRE | PERSIST,
}
