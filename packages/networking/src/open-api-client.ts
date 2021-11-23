import 'isomorphic-fetch'
import { log } from '@radixdlt/util'
import { v4 as uuid } from 'uuid'
import { DefaultApi } from './generated-open-api-client/apis/DefaultApi'
import { BaseAPI, Configuration } from './generated-open-api-client/runtime'
import { Client } from './_types'
import { ok, Ok } from 'neverthrow'

const headers = ['X-Radixdlt-Method', 'X-Radixdlt-Correlation-Id']

const correlationID = uuid()

type Api = InstanceType<typeof DefaultApi>

type BaseAPIType = InstanceType<typeof BaseAPI>

type Method = Omit<Api, keyof BaseAPIType>

type MethodKey = keyof Omit<Api, keyof BaseAPIType>

type OpenApiClientCall = <
	M extends MethodKey,
	P extends Parameters<Api[M]>[0],
	R extends ReturnType<Method[M]>,
>(
	method: M,
	param: P,
) => Promise<Ok<R, any>>

type OpenApiClient = Client<OpenApiClientCall>

export const openApiClient: OpenApiClient = (url: URL) => {
	const client = new DefaultApi(
		new Configuration({ basePath: url.toString() }),
	)

	const call = async <
		M extends MethodKey,
		P extends Parameters<Api[M]>[0],
		R extends ReturnType<Method[M]>,
	>(
		method: M,
		params: P,
	): Promise<Ok<R, any>> => {
		const requestHeaders = {
			[headers[0]]: method,
			[headers[1]]: correlationID,
		}

		log.info(
			`Sending RPC request with method ${method}. ${JSON.stringify(
				params,
				null,
				2,
			)}`,
		)

		// @ts-ignore allow dynamic method call
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		const response: R = await client[method](params, {
			headers: requestHeaders,
		})

		return ok(response)
	}

	return {
		call,
	}
}
