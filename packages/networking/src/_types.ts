import { Method } from "./open-rpc-client"

export type Transport = {
	call: (
		method: Method,
		params: unknown[] | Record<string, unknown>,
	) => Promise<unknown>
}

export type Client = (url: URL) => Transport
