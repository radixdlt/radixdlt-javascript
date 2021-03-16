import { RPCClient } from '@radixdlt/networking'
import { NodeAPI } from '../_types'
import { getAPI } from './json-rpc/interface'

export const nodeAPI = (url: URL): NodeAPI => ({
	...getAPI(RPCClient(url).call),
})
