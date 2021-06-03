import {
	RequestManager,
	Client as OpenRPCClient,
	HTTPTransport,
} from '@open-rpc/client-js'
import { Transport, Client } from './_types'
import { isArray, log } from '@radixdlt/util'
import { validate } from 'open-rpc-utils'
import { v4 as uuid } from 'uuid'
const spec = require('@radixdlt/open-rpc-spec')

const validateMethod = validate.bind(null, spec)

const headers = ['X-Radixdlt-Method', 'X-Radixdlt-Correlation-Id']

export const RPCClient: Client = (url: URL): Transport => {
	const call = async (
		endpoint: string,
		params: unknown[] | Record<string, unknown>,
	): Promise<unknown> => {
		const transport = new HTTPTransport(url.toString(), {
			headers: {
				[headers[0]]: endpoint,
				[headers[1]]: uuid()
			}
		})
		
		const requestManager = new RequestManager([transport])
		const client = new OpenRPCClient(requestManager)

		const filteredParams = isArray(params)
			? params.filter(item => !!item)
			: params

		log.info(
			`Sending RPC request with endpoint ${endpoint}. ${JSON.stringify(
				filteredParams,
				null,
				2,
			)}`
		)

		const result = await validateMethod(endpoint, filteredParams)
		result.mapErr(err => {
			throw err
		})

		/*
		console.log(
			`sending to ${endpoint}: ${JSON.stringify(
				filteredParams,
				null,
				2,
			)}`,
		)*/

		const response:
			| Record<string, unknown>
			| unknown[] = await client.request({
			method: endpoint,
			params: filteredParams,
		})
		log.info(
			`Response from ${endpoint} call: ${JSON.stringify(
				response,
				null,
				2,
			)}`,
		)

		//console.log(`response for ${endpoint} `, JSON.stringify(response, null, 2))
		// TODO validate response

		return response
	}

	return {
		call,
	}
}
