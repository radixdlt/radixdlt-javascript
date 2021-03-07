import { Result } from 'neverthrow'

export const SERIALIZER = 'serializer'

export enum Tag {
	STRING = ':str:',
}

export type Decoder = (
	value: unknown,
	key?: string,
) => Result<unknown, Error> | undefined

export type DecodingFn = <T>(json: T) => Result<unknown, Error[]>

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

export type JSONDecodable<T> = {
	fromJSON: (json: unknown) => Result<T, Error[]>
	JSONDecoders: Decoder[]
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
