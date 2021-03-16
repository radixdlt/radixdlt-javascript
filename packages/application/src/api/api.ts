import { RPCClient } from '@radixdlt/networking'
import { getAPI } from './json-rpc/interface'

export const nodeAPI = (url: URL) => ({
	...getAPI(RPCClient(url).call),
})
