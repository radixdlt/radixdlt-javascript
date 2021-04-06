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

	const call = async (
		endpoint: string,
		...params: unknown[]
	): Promise<unknown> => {
		log.info(`Sending RPC request with endpoint ${endpoint}.`)
		const response:
			| Record<string, unknown>
			| unknown[] = await client.request({ method: endpoint, params })
		log.trace(`Response from call: ${JSON.stringify(response, null, 2)}`)
		return response
	}

	return {
		call,
	}
}
