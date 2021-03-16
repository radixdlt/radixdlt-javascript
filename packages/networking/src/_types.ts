export type Transport = {
	call: (endpoint: string, ...params: unknown[]) => Promise<unknown>
}

export type Client = (url: URL) => Transport
