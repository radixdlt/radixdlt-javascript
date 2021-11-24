import { Result, ResultAsync } from 'neverthrow'
import { OpenApiClientCall } from '@radixdlt/networking'
import { ApiMethod, NetworkEndpoint } from './_types'
import { handleNetworkResponse } from './responseHandlers'
import { andThen, pipe } from 'ramda'

const callAPI =
	<Params, DecodedResponse>(endpoint: ApiMethod) =>
	(
		call: (endpoint: ApiMethod, params: Params) => Promise<unknown>,
		handleResponse: (response: unknown) => Result<DecodedResponse, Error[]>,
	) =>
	(params: Params) =>
		pipe(call, andThen(handleResponse), value =>
			// @ts-ignore
			ResultAsync.fromPromise(value, (e: Error[]) => e).andThen(r => r),
		)(endpoint, params)

const setupAPICall =
	(call: (endpoint: ApiMethod, params: any) => Promise<unknown>) =>
	<I, R>(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		handleResponse: (response: any) => Result<R, any>,
	) =>
	(endpoint: ApiMethod) =>
		callAPI<I, R>(endpoint)(call, handleResponse)

export const getAPI = (call: OpenApiClientCall) => {
	const setupAPIResponse = setupAPICall(call)

	return {
		[ApiMethod.NETWORK]: setupAPIResponse<
			NetworkEndpoint.Input,
			NetworkEndpoint.DecodedResponse
		>(handleNetworkResponse)(ApiMethod.NETWORK),
	}
}
