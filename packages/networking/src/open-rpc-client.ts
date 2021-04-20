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
		params = params.filter((item) => !!item)
		console.log(
			`sending to ${endpoint}: ${JSON.stringify(params, null, 2)}`,
		)
		const response:
			| Record<string, unknown>
			| unknown[] = await client.request({ method: endpoint, params })
		log.verbose(`Response from call: ${JSON.stringify(response, null, 2)}`)

		//console.log(response)
		// TODO validate response

		return response
	}

	return {
		call,
	}
}
