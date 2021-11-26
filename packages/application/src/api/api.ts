import { openApiClient } from '@radixdlt/networking'
import { getAPI } from './open-api/interface'
import { NodeAPI } from './_types'

export const nodeAPI = (url: URL) => ({
	...getAPI(openApiClient(url).call),
})
