import { CBOREncodablePrimitive } from './cborEncodablePrimitive'

declare module 'cbor' {
	type Encoder = {
		new (options: EncoderOptions): CBOREncoder
	}
	type EncoderOptions = {
		highWaterMark: number
		collapseBigIntegers: boolean
	}
	type CBOREncoder = {
		_encodeAll: (
			data: (CBOREncodablePrimitive | CBOREncodableObject)[],
		) => Buffer
		pushAny: (
			any:
				| CBOREncodablePrimitive
				| CBOREncodableObject
				| CBOREncodableObject[],
		) => boolean
		push: (chunk: Buffer) => boolean
	}
	type CBOREncodableObject = Readonly<{
		encodeCBOR: (encoder: CBOREncoder) => boolean
	}>

	export const Encoder: Encoder
}
