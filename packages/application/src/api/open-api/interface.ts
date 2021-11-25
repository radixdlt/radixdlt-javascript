import {
	Api,
	Method,
	MethodName,
	openApiClient,
	Call,
} from '@radixdlt/networking'
import { handleNetworkResponse } from './responseHandlers'
import { andThen, pipe } from 'ramda'

const callApi =
	<M extends MethodName, DecodedResponse>(method: M) =>
	(
		call: Call<M, Method[M], Parameters<Api[M]>[0]>,
		handleResponse: (
			response: Awaited<ReturnType<Method[M]>>,
		) => DecodedResponse,
	) =>
	(params: Parameters<Api[M]>[0]) =>
		pipe(() => call(method, params), andThen(handleResponse))()

export const getAPI = (call: any) => ({
	getNetwork: callApi<
		'networkPost',
		ReturnType<typeof handleNetworkResponse>
	>('networkPost')(call, handleNetworkResponse),
})

// getAPI(openApiClient(new URL('')).call)
// 	.networkPost({ body: {} })
// 	.then(res => {})

// openApiClient(new URL('')).call('accountBalancesPost', { a })
