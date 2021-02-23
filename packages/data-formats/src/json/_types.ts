import { Result } from 'neverthrow'

export enum Tag {
	STRING = ':str:',
}

export enum Decoder {
	PRIMITIVE,
	OBJECT,
}

export const SERIALIZER = 'serializer'

export type JSONPrimitiveDecoder = {
	decoder: {
		[tag: string]: (data: string) => Result<string | JSONEncodable, Error>
	}
	type: Decoder.PRIMITIVE
}

export type JSONObjectDecoder = {
	decoder: {
		[serializer: string]: (
			input: Record<string, unknown>,
		) => Result<JSONEncodable, Error>
	}
	type: Decoder.OBJECT
}

export type JSONKeyValues = {
	[key: string]: JSONEncodablePrimitive | JSONEncodable | JSONEncodable[]
	serializer?: string
}

export type JSONDecodableObject = {
	[key: string]:
		| number
		| boolean
		| string
		| undefined
		| JSONDecodablePrimitive
		| JSONDecodableObject
		| JSONDecodableObject[]
}

export type JSONEncodableObject = {
	[key: string]: FromJSONOutput
}

export type FromJSONOutput =
	| number
	| boolean
	| string
	| undefined
	| JSONEncodable
	| JSONEncodableObject
	| FromJSONOutput[]

export type JSONDecodable = {
	fromJSON: (json: JSONDecodableObject) => Result<any, Error>
	JSONDecoders: (JSONObjectDecoder | JSONPrimitiveDecoder)[]
}

export type JSONEncodable = {
	toJSON: () => Result<JSONDecodablePrimitive, Error>
}

export type JSONEncodablePrimitive =
	| number
	| boolean
	| string
	| undefined
	| JSONEncodableObject
	| JSONEncodablePrimitive[]

export type JSONDecodablePrimitive =
	| number
	| boolean
	| string
	| undefined
	| JSONDecodableObject
	| JSONDecodablePrimitive[]
