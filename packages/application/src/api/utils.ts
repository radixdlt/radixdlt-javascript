import { Endpoint } from './json-rpc/_types'
import { pipe, andThen } from 'ramda'
import { Result } from 'neverthrow'

export const callAPI = <Params extends unknown[], DecodedResponse>(
	endpoint: Endpoint,
) => (
	call: (endpoint: Endpoint, params: Params) => Promise<unknown>,
	handleResponse: (
		response: unknown,
	) => Result<DecodedResponse, Error[] | Error>,
) => (...params: Params) =>
	// ignore typecheck here because typings in Ramda pipe can't handle the spread operator.
	// @ts-ignore
	pipe(call, andThen(handleResponse))(endpoint, ...params)
