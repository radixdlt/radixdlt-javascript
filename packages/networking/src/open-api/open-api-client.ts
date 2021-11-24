import 'isomorphic-fetch'
import { log } from '@radixdlt/util'
import { v4 as uuid } from 'uuid'
import { DefaultApi } from './codegen/apis/DefaultApi'
import { Configuration } from './codegen/runtime'
import { ok, Ok } from 'neverthrow'
import { Method, MethodKey, OpenApiClient } from './_types'

const headers = ['X-Radixdlt-Method', 'X-Radixdlt-Correlation-Id']

const correlationID = uuid()

export const openApiClient: OpenApiClient = (url: URL) => {
	const client = new DefaultApi(
		new Configuration({ basePath: url.toString() }),
	)

	const call = async <
		M extends MethodKey,
		P extends Parameters<Method[M]>[0],
		R extends ReturnType<Method[M]>,
	>(
		method: M,
		params: P,
	): Promise<Ok<R, any>> => {
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
			headers: {
				[headers[0]]: method,
				[headers[1]]: correlationID,
			},
		})

		return ok(response)
	}

	return {
		call,
	}
}
