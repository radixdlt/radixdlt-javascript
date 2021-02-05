export enum Tag {
	STRING = ':str:',
}

export const SERIALIZER = 'serializer'

export type JSONPrimitiveDecoder = {
	[tag: string]: (data: string) => JSONEncodablePrimitive
}

export type JSONObjectDecoder = {
	[serializer: string]: (
		input: unknown,
	) => Record<string, JSONEncodablePrimitive>
}

export type JSONEncodable = {
	toJSON: () => JSONEncodablePrimitive
}

export type JSONEncodablePrimitive =
	| number
	| boolean
	| string
	| { [key: string]: JSONEncodablePrimitive }
	| JSONEncodablePrimitive[]
