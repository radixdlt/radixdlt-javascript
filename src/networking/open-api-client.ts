import 'isomorphic-fetch'
import { log } from '../util'
import { v4 as uuid } from 'uuid'
import { Client } from './_types'
import { ResultAsync, err } from 'neverthrow'
import { pipe } from 'ramda'
import { TransactionBuildResponse } from './open-api/api'
import { DefaultApiFactory } from '.'
import { AxiosResponse, AxiosError } from 'axios'
import { Configuration } from './open-api'

const headers = ['X-Radixdlt-Method', 'X-Radixdlt-Correlation-Id']

const correlationID = uuid()

export type ReturnOfAPICall<Name extends MethodName> =
	Name extends 'transactionBuildPost'
		? AxiosResponse<TransactionBuildResponse>
		: Awaited<ReturnType<ClientInterface[Name]>>

export type InputOfAPICall<Name extends MethodName> = Parameters<
	ClientInterface[Name]
>[0]

export type ClientInterface = ReturnType<typeof DefaultApiFactory>
export type MethodName = keyof ClientInterface
export type Response = ReturnOfAPICall<MethodName>

const handleError = (error: AxiosError) => {
	log.debug(error)
	if (error.isAxiosError && error.response?.data) {
		return err({
			code: error.response.data.code ?? error.response.status,
			...(typeof error.response.data === 'object'
				? error.response.data
				: { message: error.response.data }),
		})
	} else {
		throw error
	}
}

const call =
	(client: ClientInterface) =>
	<M extends MethodName>(
		method: M,
		params: InputOfAPICall<M>,
	): ResultAsync<ReturnOfAPICall<M>, Error> =>
		// @ts-ignore
		pipe(
			() =>
				log.info(
					`Sending api request with method ${method}. ${JSON.stringify(
						params,
						null,
						2,
					)}`,
				),
			() =>
				ResultAsync.fromPromise(
					// @ts-ignore
					client[method](params, {
						Headers: {
							[headers[0]]: method,
							[headers[1]]: correlationID,
						},
					}).then(response => {
						log.info(
							`Response from api with method ${method}`,
							JSON.stringify(response.data, null, 2),
						)

						return response
					}),
					// @ts-ignore
					handleError,
				),
		)()

export type OpenApiClientCall = ReturnType<typeof call>

export const openApiClient: Client<'open-api'> = (url: URL) => ({
	type: 'open-api',
	call: call(
		DefaultApiFactory(
			new Configuration({ basePath: url.toString().slice(0, -1) }),
		),
	),
})
