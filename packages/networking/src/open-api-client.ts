import 'isomorphic-fetch'
import { log } from '../../util'
import { v4 as uuid } from 'uuid'
import { Client } from './_types'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'
import { pipe } from 'ramda'
import {
	DefaultApi,
	TransactionBuild,
	TransactionBuildError,
	TransactionBuildResponse,
	TransactionBuildResponseError,
	TransactionBuildResponseSuccess,
} from './open-api/api'
import { BaseAPI } from './open-api/base'
import { Configuration } from './open-api/configuration'
import { DefaultApiFactory, DefaultApiFp } from '.'
import axios, { AxiosResponse } from 'axios'

const isTransactionBuildResponse = (
	response: any,
): response is TransactionBuildResponse => response.type != undefined

const isBuildResponseSuccess = (
	response: TransactionBuildResponse,
): response is TransactionBuildResponseSuccess =>
	response.type === 'TransactionBuildResponseSuccess'

const isBuildResponseError = (
	response: TransactionBuildResponse,
): response is TransactionBuildResponseError =>
	response.type === 'TransactionBuildResponseError'

// const handleBuildResponse = (
// 	response: TransactionBuildResponse,
// ): Result<TransactionBuild, TransactionBuildError | Error> =>
// 	isBuildResponseSuccess(response)
// 		? ok(response.transactionBuild)
// 		: isBuildResponseError(response)
// 		? err(response.error)
// 		: err(Error('Unexpected build transaction response.'))

const headers = ['X-Radixdlt-Method', 'X-Radixdlt-Correlation-Id']

const correlationID = uuid()

export type ReturnOfAPICall<Name extends MethodName> =
	Name extends 'transactionBuildPost'
		? AxiosResponse<TransactionBuildResponseSuccess>
		: Awaited<ReturnType<ClientInterface[Name]>>

export type InputOfAPICall<Name extends MethodName> = Parameters<
	ClientInterface[Name]
>[0]

export type ClientInterface = ReturnType<typeof DefaultApiFactory>
export type MethodName = keyof ClientInterface
export type Response = ReturnOfAPICall<MethodName>

const call = (client: ClientInterface) => <
	M extends MethodName
>(method: M, params: InputOfAPICall<M>): ResultAsync<ReturnOfAPICall<M>, Error> =>
// @ts-ignore
	pipe(
		() => console.log(`Sending api request with method ${method}. ${JSON.stringify(params, null, 2,)}`),
		() => ResultAsync.fromPromise(
			// @ts-ignore
			// { headers: { [headers[0]]: method, [headers[1]]: correlationID } }
			client[method](params).then(x => {
				console.log('RESPONSE FROM API', method,JSON.stringify(x.data, null, 2))
				return x
			}),
			// @ts-ignore
			(e: Error) => e
		)
	)().mapErr(e => {
		console.error(e)
		return e
	})

export type OpenApiClientCall = ReturnType<typeof call>

export const openApiClient: Client<'open-api'> = (url: URL) => ({
	type: 'open-api',
	call: call(
		DefaultApiFactory(
			undefined,
			undefined,
			axios.create({
				baseURL: url.toString(),
			})
		)
	),
})
