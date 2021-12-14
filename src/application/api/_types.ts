import { gatewayAPI } from './gatewayAPI'
import { getAPI } from './json-rpc'
import { radixAPI } from './radixAPI'

type JsonRpcAPI = {
	[Property in keyof ReturnType<typeof getAPI>]: ReturnType<
		typeof getAPI
	>[Property]
}

export type GatewayAPI = ReturnType<typeof gatewayAPI>

export type NodeT = Readonly<{
	url: URL
}>

export type RadixAPI = Omit<RadixCoreAPI, 'node'>

export type RadixCoreAPI = ReturnType<typeof radixAPI>
