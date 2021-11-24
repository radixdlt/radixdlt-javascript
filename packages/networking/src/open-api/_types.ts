import { BaseAPI } from './codegen/runtime'
import { DefaultApi } from './codegen/apis/DefaultApi'
import { Client } from '../_types'

export type Api = InstanceType<typeof DefaultApi>

export type BaseAPIType = InstanceType<typeof BaseAPI>

export type Method = Omit<Api, keyof BaseAPIType>

export type MethodKey = keyof Method

type OpenApiClientCall = <
	M extends MethodKey,
	P extends Parameters<Api[M]>[0],
	R extends ReturnType<Method[M]>,
>(
	method: M,
	param: P,
) => Promise<Ok<R, any>>

export type OpenApiClient = Client<OpenApiClientCall>
