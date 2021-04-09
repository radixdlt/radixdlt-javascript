import { Result } from 'neverthrow'

export type Decoder = (
	value: unknown,
	key?: string,
) => Result<unknown, Error> | undefined

export type DecodingFn = <T>(json: T) => Result<unknown, Error[]>

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

export type JSONDecodable<T> = {
	fromJSON: (json: unknown) => Result<T, Error[]>
	JSONDecoders: Decoder[]
}

export type JSONDecodablePrimitive =
	| number
	| boolean
	| string
	| undefined
	| JSONDecodableObject
	| JSONDecodablePrimitive[]
