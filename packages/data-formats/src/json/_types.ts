import { Result } from 'neverthrow'

export type Decoder = (
	value: unknown,
	key?: string,
) => Result<unknown, Error> | undefined

export type JSONDecodable<T> = {
	fromJSON: (json: unknown) => Result<T, Error[]>
	JSONDecoders: Decoder[]
}
