import { openApiClient } from '@networking'
import { getAPI } from './open-api/interface'

export const gatewayAPI = (url: URL) => getAPI(openApiClient(url).call)
