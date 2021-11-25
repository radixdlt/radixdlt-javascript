import {
	InputOfAPICall,
	MethodName,
	OpenApiClientCall,
	ReturnOfAPICall,
} from '@radixdlt/networking'
import { handleNetworkResponse } from './responseHandlers'
import { pipe } from 'ramda'
import { Result } from 'neverthrow'

const callApi =
	<DecodedResponse, M extends MethodName>(method: M) =>
		(
			call: OpenApiClientCall,
			handleResponse: (
				response: ReturnOfAPICall<M>,
			) => Result<DecodedResponse, Error[]>,
		) =>
			(params: InputOfAPICall<M>) =>
				pipe(
					() => call(method, params),
					result => result.map(handleResponse),
				)()

export const getAPI = (call: OpenApiClientCall) => ({
	getNetwork: callApi('networkPost')(call, handleNetworkResponse)
})

// getAPI(openApiClient(new URL('')).call)
// 	.networkPost({ body: {} })
// 	.then(res => {})

// openApiClient(new URL('')).call('accountBalancesPost', { a })