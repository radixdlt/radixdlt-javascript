import { gatewayAPI } from './gatewayAPI'
import { radixAPI } from './radixAPI'

export type GatewayAPI = ReturnType<typeof gatewayAPI>

export type NodeT = Readonly<{
  url: URL
}>

export type RadixAPI = Omit<RadixCoreAPI, 'node'>

export type RadixCoreAPI = ReturnType<typeof radixAPI>
