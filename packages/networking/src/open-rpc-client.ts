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

export enum Method {
	NETWORK_ID = 'get_id',
	TOKEN_BALANCES = 'get_balances',
	TRANSACTION_HISTORY = 'get_transaction_history',
	STAKES = 'get_stake_positions',
	UNSTAKES = 'get_unstake_positions',
	TX_STATUS = 'get_transaction_status',
	NETWORK_TX_THROUGHPUT = 'get_throughput',
	NETWORK_TX_DEMAND = 'get_demand',
	VALIDATORS = 'get_next_epoch_set',
	LOOKUP_TX = 'lookup_transaction',
	LOOKUP_VALIDATOR = 'lookup_validator',
	NATIVE_TOKEN = 'get_native_token',
	TOKEN_INFO = 'get_info',
	BUILD_TX_FROM_INTENT = 'build_transaction',
	SUBMIT_TX = 'submit_transaction',
	FINALIZE_TX = 'finalize_transaction',
}

enum Category {
	NETWORK = 'network',
	ACCOUNT = 'account',
	VALIDATOR = 'validator',
	TOKEN = 'token',
	TRANSACTION = 'transaction',
	CONSTRUCTION = 'construction'
}

export const Endpoint = {
	[Method.NETWORK_ID]: Category.NETWORK,
	[Method.TOKEN_BALANCES]: Category.ACCOUNT,
	[Method.TRANSACTION_HISTORY]: Category.ACCOUNT,
	[Method.STAKES]: Category.ACCOUNT,
	[Method.UNSTAKES]: Category.ACCOUNT,
	[Method.TX_STATUS]: Category.TRANSACTION,
	[Method.NETWORK_TX_THROUGHPUT]: Category.NETWORK,
	[Method.NETWORK_TX_DEMAND]: Category.NETWORK,
	[Method.VALIDATORS]: Category.VALIDATOR,
	[Method.LOOKUP_TX]: Category.TRANSACTION,
	[Method.LOOKUP_VALIDATOR]: Category.VALIDATOR,
	[Method.NATIVE_TOKEN]: Category.TOKEN,
	[Method.TOKEN_INFO]: Category.TOKEN,
	[Method.BUILD_TX_FROM_INTENT]: Category.CONSTRUCTION,
	[Method.SUBMIT_TX]: Category.CONSTRUCTION,
	[Method.FINALIZE_TX]: Category.CONSTRUCTION,
}

const correlationID = uuid()

export const RPCClient: Client = (url: URL): Transport => {
	const call = async (
		method: Method,
		params: unknown[] | Record<string, unknown>,
	): Promise<unknown> => {
		const endpoint = `${url.toString()}${Endpoint[method]}`

		const transport = new HTTPTransport(endpoint, {
			headers: {
				[headers[0]]: method,
				[headers[1]]: correlationID,
			},
		})

		const requestManager = new RequestManager([transport])
		const client = new OpenRPCClient(requestManager)

		const filteredParams = isArray(params)
			? params.filter(item => !!item)
			: params

		log.info(
			`Sending RPC request with method ${method}. ${JSON.stringify(
				filteredParams,
				null,
				2,
			)}`,
		)

		const result = await validateMethod(method, filteredParams)
		result.mapErr(err => {
			// need to disable this until rpc spec is fixed with the latest addresses and RRI's
			//	throw err
		})

		/*
		console.log(
			`calling ${method} at ${endpoint} with: ${JSON.stringify(
				filteredParams,
				null,
				2,
			)}`,
		)
*/

		const response:
			| Record<string, unknown>
			| unknown[] = await client.request({
				method: method,
				params: filteredParams,
			})

		log.info(
			`Response from ${method} call: ${JSON.stringify(
				response,
				null,
				2,
			)}`,
		)

		// console.log(`response for ${method} at ${endpoint}`, JSON.stringify(response, null, 2))
		// TODO validate response

		return response
	}

	return {
		call,
	}
}
