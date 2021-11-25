import 'isomorphic-fetch'
import { log } from '@radixdlt/util'
import { v4 as uuid } from 'uuid'
import { DefaultApi, BaseAPI, Configuration } from './open-api'
import { Client } from './_types'
import { ResultAsync } from 'neverthrow'
import { pipe } from 'ramda'

const headers = ['X-Radixdlt-Method', 'X-Radixdlt-Correlation-Id']

const correlationID = uuid()

export type Api = InstanceType<typeof DefaultApi>
type BaseAPIType = InstanceType<typeof BaseAPI>

type RemoveRawMethods<Methods> = {
	[Property in keyof Methods as Exclude<
		Property,
		`${string}Raw`
	>]: Methods[Property]
}

export type Method = RemoveRawMethods<Omit<Api, keyof BaseAPIType>>
export type MethodName = keyof Method
export type Response = Awaited<ReturnType<Method[MethodName]>>

const call =
	(client: DefaultApi) =>
	<M extends MethodName>(
		method: M,
		params: Parameters<Method[M]>[0],
	): ResultAsync<Response, Error> =>
		pipe(
			() =>
				log.info(
					`Sending RPC request with method ${method}. ${JSON.stringify(
						params,
						null,
						2,
					)}`,
				),
			() =>
				ResultAsync.fromPromise(
					// @ts-ignore
					client[method](params, {
						headers: {
							[headers[0]]: method,
							[headers[1]]: correlationID,
						},
					}),
					(e: Error) => e,
				),
		)()

export type OpenApiClientCall = ReturnType<typeof call>

export const openApiClient: Client<'open-api'> = (url: URL) => ({
	type: 'open-api',
	call: call(new DefaultApi(new Configuration({ basePath: url.toString() }))),
})
