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

export type JSONEncodable = {
	toJSON: () => JSONDecodablePrimitive
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
