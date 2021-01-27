import { CBOREncodableObject, CBOREncodablePrimitive } from '../src/_types'

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
		addSemanticType: (
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			type: any,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			fn: (encoder: CBOREncoder, obj: any) => boolean,
		) => undefined
		pushAny: (
			any:
				| CBOREncodablePrimitive
				| CBOREncodableObject
				| CBOREncodableObject[],
		) => boolean
		push: (chunk: Buffer) => boolean
	}

	export const Encoder: Encoder
}
