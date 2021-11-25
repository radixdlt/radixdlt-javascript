import {
	InputOfAPICall,
	MethodName,
	OpenApiClientCall,
	ReturnOfAPICall,
} from '@radixdlt/networking'
import { handleNativeTokenResponse, handleNetworkResponse } from './responseHandlers'
import { pipe } from 'ramda'
import { Result } from 'neverthrow'
import { handleTokenInfoResponse } from '..'

const callAPIWith =
	(call: OpenApiClientCall) =>
	<DecodedResponse, M extends MethodName>(method: M) =>
	(handleResponse: (response: ReturnOfAPICall<M>) => Result<DecodedResponse, Error[]>) =>
		(params: InputOfAPICall<M>) =>
			pipe(
				() => call(method, params),
				result => result.map(handleResponse),
			)()

export const getAPI = pipe(
	(call: OpenApiClientCall) => callAPIWith(call),
	callAPI => ({
		getNetwork: callAPI('networkPost')(handleNetworkResponse),
		getTokenInfo: callAPI('tokenPost')(handleTokenInfoResponse),
		getNativeTokenInfo: callAPI('tokenNativePost')(handleNativeTokenResponse)
	})
)

// getAPI(openApiClient(new URL('')).call)
// 	.networkPost({ body: {} })
// 	.then(res => {})

// openApiClient(new URL('')).call('accountBalancesPost', { a })