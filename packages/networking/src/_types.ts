export type Transport = {
	call: (
		endpoint: string,
		params: Record<string, unknown>,
	) => Promise<unknown>
}

export type Client = (url: URL) => Transport
