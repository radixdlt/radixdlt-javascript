import { Result } from 'neverthrow'

export enum Tag {
	STRING = ':str:',
}

export const SERIALIZER = 'serializer'

export type JSONPrimitiveDecoder = {
	[tag: string]: (data: string) => Result<string | JSONEncodable, Error>
}

export type JSONObjectDecoder = {
	[serializer: string]: (input: any) => Result<JSONEncodable, Error>
}

export type JSONKeyValues = {
	[key: string]: JSONEncodablePrimitive | JSONEncodable
	serializer?: string
}

export type JSONDecodableObject = {
	[key: string]: number | boolean | string | JSONDecodableObject
}

export type JSONEncodableObject = {
	[key: string]:
		| number
		| boolean
		| string
		| bigint
		| JSONEncodable
		| JSONEncodableObject
}

export type FromJSONOutput =
	| number
	| boolean
	| string
	| JSONEncodable
	| FromJSONOutput[]
	| JSONEncodableObject

export type JSONEncodable = {
	toJSON: () => JSONEncodablePrimitive
}

export type JSONEncodablePrimitive =
	| number
	| boolean
	| string
	| bigint
	| undefined
	| JSONDecodableObject
	| JSONEncodablePrimitive[]

export type JSONDecodablePrimitive =
	| number
	| boolean
	| string
	| JSONDecodableObject
	| JSONDecodablePrimitive[]
