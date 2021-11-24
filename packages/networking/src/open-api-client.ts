import 'isomorphic-fetch'
import { log } from '@radixdlt/util'
import { v4 as uuid } from 'uuid'
import { DefaultApi } from './generated-open-api-client/apis/DefaultApi'
import { BaseAPI, Configuration } from './generated-open-api-client/runtime'
import { Client } from './_types'
import { ResultAsync } from 'neverthrow'

const headers = ['X-Radixdlt-Method', 'X-Radixdlt-Correlation-Id']

const correlationID = uuid()

type Api = InstanceType<typeof DefaultApi>

type BaseAPIType = InstanceType<typeof BaseAPI>

type Method = Omit<Api, keyof BaseAPIType>

type MethodKey = keyof Omit<Api, keyof BaseAPIType>

const call = (client: DefaultApi) => <
	M extends MethodKey
>(method: M, params: Parameters<Api[M]>[0]): ResultAsync<ReturnType<Method[M]>, Error> => {
	log.info(
		`Sending RPC request with method ${method}. ${JSON.stringify(
			params,
			null,
			2,
		)}`,
	)

	// @ts-ignore
	return ResultAsync.fromPromise(
		// @ts-ignore
		client[method](params, {
			headers: {
				[headers[0]]: method,
				[headers[1]]: correlationID,
			}
		}),
		e => e
	)
}

export type OpenApiClientCall = ReturnType<typeof call>

export const openApiClient: Client<'open-api'> = (url: URL) => ({
	type: 'open-api',
	call: call(
		new DefaultApi(
			new Configuration({ basePath: url.toString() })
		))
})
