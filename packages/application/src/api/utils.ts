import { Endpoint } from "./_types"
import { pipe, andThen } from 'ramda'

export const callAPI = <Params extends unknown[], Response>(endpoint: Endpoint) => (
    call: (endpoint: Endpoint, params: Params) => Promise<Response>, handleResponse: (response: Response) => Response
) => (...params: Params) =>
        pipe(
            call,
            andThen(handleResponse)
        )(endpoint, params)

