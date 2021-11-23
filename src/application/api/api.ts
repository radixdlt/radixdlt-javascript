import { RPCClient } from '@networking'
import { getAPI } from './json-rpc/interface'
import { NodeAPI } from './_types'

export const nodeAPI = (url: URL): NodeAPI => ({
	...getAPI(RPCClient(url).call),
})
