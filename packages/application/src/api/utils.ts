import { Endpoint } from "./_types"
import { pipe, andThen } from 'ramda'
import { Result } from "neverthrow"

export const callAPI = <Params extends unknown[], DecodedResponse>(endpoint: Endpoint) => (
    call: (endpoint: Endpoint, params: Params) => Promise<unknown>, handleResponse: (response: unknown) => Result<DecodedResponse, Error[] | Error>
) => (...params: Params) =>
        pipe(
            call,
            andThen(handleResponse)
        )(endpoint, params)

