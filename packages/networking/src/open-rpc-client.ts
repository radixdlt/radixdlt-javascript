import {
	RequestManager,
	Client as OpenRPCClient,
	HTTPTransport,
} from '@open-rpc/client-js'
import { Transport, Client } from './_types'
import { log } from '@radixdlt/util'

export const RPCClient: Client = (url: URL): Transport => {
	const transport = new HTTPTransport(url.toString())
	const requestManager = new RequestManager([transport])
	const client = new OpenRPCClient(requestManager)

	const call = (endpoint: string, ...params: unknown[]): Promise<unknown> =>
	{
		log.info(`Sending RPC request with endpoint ${endpoint}.`)
		return client.request({ method: endpoint, params })
	}

	return {
		call,
	}
}
