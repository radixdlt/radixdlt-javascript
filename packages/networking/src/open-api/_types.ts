import { BaseAPI } from './codegen/runtime'
import { DefaultApi } from './codegen/apis/DefaultApi'
import { Client } from '../_types'
import { Ok } from 'neverthrow'

export type Api = InstanceType<typeof DefaultApi>

type BaseAPIType = InstanceType<typeof BaseAPI>

export type Method = Omit<Api, keyof BaseAPIType>

export type MethodKey = keyof Method

export type OpenApiClientCall = <
	M extends MethodKey,
	P extends Parameters<Api[M]>[0],
	R extends ReturnType<Method[M]>,
>(
	method: M,
	param: P,
) => Promise<Ok<R, any>>

export type OpenApiClient = Client<OpenApiClientCall>
