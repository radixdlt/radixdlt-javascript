import { getAPI } from './json-rpc'
import { radixAPI } from './radixAPI'

type JsonRpcAPI = {
	[Property in keyof ReturnType<typeof getAPI>]: ReturnType<
		typeof getAPI
	>[Property]
}

export type NodeAPI = JsonRpcAPI // && RestAPI

export type RadixAPI = {
	[Property in keyof ReturnType<typeof radixAPI>]: ReturnType<
		typeof radixAPI
	>[Property]
}