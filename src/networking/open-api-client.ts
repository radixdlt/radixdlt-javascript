import 'isomorphic-fetch'
import { log, radixError, RadixError } from '@util'
import { v4 as uuid } from 'uuid'
import { Client } from './_types'
import { ResultAsync } from 'neverthrow'
import { pipe } from 'ramda'
import { TransactionBuildResponse } from './open-api/api'
import {
  apiVersion,
  AccountEndpointApiFactory,
  ValidatorEndpointApiFactory,
  TransactionEndpointApiFactory,
  TokenEndpointApiFactory,
  GatewayEndpointApiFactory,
} from '.'

import { AxiosResponse, AxiosError } from 'axios'
import { Configuration } from './open-api'

const defaultHeaders = [
  'X-Radixdlt-Method',
  'X-Radixdlt-Correlation-Id',
  'X-Radixdlt-Target-Gw-Api',
]

const correlationID = uuid()

export type ReturnOfAPICall<Name extends MethodName> =
  Name extends 'transactionBuildPost'
    ? AxiosResponse<TransactionBuildResponse>
    : Awaited<ReturnType<ClientInterface[Name]>>

export type InputOfAPICall<Name extends MethodName> = Parameters<
  ClientInterface[Name]
>[0]

export type ClientInterface = ReturnType<typeof AccountEndpointApiFactory> &
  ReturnType<typeof ValidatorEndpointApiFactory> &
  ReturnType<typeof TransactionEndpointApiFactory> &
  ReturnType<typeof TokenEndpointApiFactory> &
  ReturnType<typeof GatewayEndpointApiFactory>

export type MethodName = keyof ClientInterface
export type Response = ReturnOfAPICall<MethodName>

const handleError = (axiosError: AxiosError) => {
  if (axiosError.response) {
    const {
      message,
      code,
      details,
      trace_id: traceId,
    } = axiosError.response.data
    const error = radixError({ message, code, details, traceId })
    log.error(JSON.stringify(error, null, 2))
    return error
  } else if (axiosError.request) {
    log.debug(axiosError.request)
    return radixError({ message: axiosError.message })
  } else {
    log.debug(axiosError)
    if (axiosError.message === 'Network Error') {
      return radixError({
        message: axiosError.message,
        details: { type: 'NetworkError' },
      })
    }
    throw axiosError
  }
}

const call =
  (client: ClientInterface) =>
  <M extends MethodName>(
    method: M,
    params: InputOfAPICall<M>,
  ): ResultAsync<ReturnOfAPICall<M>, RadixError> =>
    // @ts-ignore
    pipe(
      () =>
        log.info(
          `Sending api request with method ${method}. ${JSON.stringify(
            params,
            null,
            2,
          )}`,
        ),
      () =>
        ResultAsync.fromPromise(
          // @ts-ignore
          client[method](params, {
            headers: {
              [defaultHeaders[0]]: method,
              [defaultHeaders[1]]: correlationID,
              [defaultHeaders[2]]: apiVersion,
            },
          }).then(response => {
            log.info(
              `Response from api with method ${method}`,
              JSON.stringify(response.data, null, 2),
            )

            return response
          }),
          // @ts-ignore
          handleError,
        ),
    )()

export type OpenApiClientCall = ReturnType<typeof call>

export const openApiClient: Client<'open-api'> = (url: URL) => {
  const configuration = new Configuration({
    basePath: url.toString().slice(0, -1),
  })
  const api = [
    AccountEndpointApiFactory,
    ValidatorEndpointApiFactory,
    TransactionEndpointApiFactory,
    TokenEndpointApiFactory,
    GatewayEndpointApiFactory,
  ].reduce<ClientInterface>(
    (acc, factory) => ({
      ...acc,
      ...factory(configuration),
    }),
    {} as ClientInterface,
  )

  return {
    type: 'open-api',
    call: call(api),
  }
}
