import { BaseAPI, Configuration, DefaultApi } from './api'
import { Transport, Client } from './_types'
import { isArray, log } from '@radixdlt/util'
import { v4 as uuid } from 'uuid'

const headers = ['X-Radixdlt-Method', 'X-Radixdlt-Correlation-Id']

const correlationID = uuid()

export const OpenAPIClient: Client = (url: URL): Transport => {
  const configuration = new Configuration({
    basePath: url.toString()
  })

  const api = new DefaultApi(configuration)

  type BaseAPI = InstanceType<typeof BaseAPI>

  type Method = keyof Omit<typeof api, keyof BaseAPI>

  type Params = Parameters<typeof api[Method]>[0]

	const call = async (
		method: string,
		params: Record<string, unknown>,
	): Promise<unknown> => {
    // @ts-ignore
    const response = await api[method as Method](params as Params)
    return response
	}

	return {
		call,
	}
}
