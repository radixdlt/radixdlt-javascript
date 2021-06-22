import { getAPI } from './json-rpc'
import { radixCoreAPI } from './radixCoreAPI'

type JsonRpcAPI = {
	[Property in keyof ReturnType<typeof getAPI>]: ReturnType<
		typeof getAPI
	>[Property]
}

export type NodeAPI = JsonRpcAPI // && RestAPI

export type NodeT = Readonly<{
	url: URL
}>

export type RadixAPI = Omit<RadixCoreAPI, 'node'>

export type RadixCoreAPI = ReturnType<typeof radixCoreAPI>
