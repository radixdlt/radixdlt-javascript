import 'isomorphic-fetch'
import { log } from '../../util'
import { v4 as uuid } from 'uuid'
import { Client } from './_types'
import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'
import { pipe } from 'ramda'
import { BaseAPI, Configuration, DefaultApi, TransactionBuild, TransactionBuildError, TransactionBuildResponse, TransactionBuildResponseError, TransactionBuildResponseSuccess } from './open-api'

const isTransactionBuildResponse = (response: any): response is TransactionBuildResponse => response.type != undefined

const isBuildResponseSuccess = (response: TransactionBuildResponse): response is TransactionBuildResponseSuccess =>
	response.type === 'TransactionBuildResponseSuccess'

const isBuildResponseError = (response: TransactionBuildResponse): response is TransactionBuildResponseError =>
	response.type === 'TransactionBuildResponseError'

const handleBuildResponse = (response: TransactionBuildResponse): Result<TransactionBuild, TransactionBuildError | Error> =>
	isBuildResponseSuccess(response) ? ok(response.transactionBuild) :
		isBuildResponseError(response) ? err(response.error) :
			err(Error('Unexpected build transaction response.'))

const headers = ['X-Radixdlt-Method', 'X-Radixdlt-Correlation-Id']

const correlationID = uuid()

type Api = InstanceType<typeof DefaultApi>
type BaseAPIType = InstanceType<typeof BaseAPI>

type RemoveRawMethods<Methods> = {
	[Property in keyof Methods as Exclude<
		Property,
		`${string}Raw`
	>]: Methods[Property]
}

export type ReturnOfAPICall<Name extends MethodName> = 
	Name extends 'transactionBuildPost'
		? TransactionBuildResponseSuccess
		: Awaited<ReturnType<Method[Name]>>

export type InputOfAPICall<Name extends MethodName> = Parameters<Method[Name]>[0]

export type Method = RemoveRawMethods<Omit<Api, keyof BaseAPIType>>
export type MethodName = keyof Method
export type Response = ReturnOfAPICall<MethodName>

const call = (client: DefaultApi) => <
	M extends MethodName
>(method: M, params: InputOfAPICall<M>): ResultAsync<ReturnOfAPICall<M>, Error> =>
	// @ts-ignore
	pipe(
		() => log.info(`Sending RPC request with method ${method}. ${JSON.stringify(params, null, 2,)}`),
		() => ResultAsync.fromPromise(
			// @ts-ignore
			client[method](params, { headers: { [headers[0]]: method, [headers[1]]: correlationID } }).catch(e => {
				console.error(e)
				throw JSON.stringify(e)
			}),
			(e) => e
		)
	)().mapErr(e => {
		console.error(e)
		return e
	})

export type OpenApiClientCall = ReturnType<typeof call>

export const openApiClient: Client<'open-api'> = (url: URL) => ({
	type: 'open-api',
	call: call(new DefaultApi(new Configuration({ basePath: url.toString().slice(0, -1) }))),
})


