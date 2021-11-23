type DefaultCall = (
	endpoint: string,
	params: unknown[] | Record<string, unknown>,
) => Promise<unknown>

export type Transport<Call = DefaultCall> = {
	call: Call
}

export type Client<T = any> = (url: URL) => Transport<T>
