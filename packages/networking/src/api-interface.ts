import { ExecutedTransactionsInput, ExecutedTransactionsResponse, Endpoint, TokenBalanceInput, TokenBalancesResponse } from "./_types"
import { pipe, andThen } from 'ramda'

const callAPI = <Params extends unknown[], Response>(endpoint: Endpoint) => (
    call: (endpoint: Endpoint, params: Params) => Promise<Response>, handleResponse: (response: Response) => Response
) => (...params: Params) =>
        pipe(
            call,
            andThen(handleResponse)
        )(endpoint, params)


export const getAPI = (
    call: (endpoint: Endpoint, ...params: unknown[]) => Promise<any>, handleResponse: (response: unknown) => any
) =>
    ({
        tokenBalances: callAPI<TokenBalanceInput, TokenBalancesResponse>(Endpoint.TOKEN_BALANCES)(call, handleResponse),
        executedTransactions: callAPI<ExecutedTransactionsInput, ExecutedTransactionsResponse>(Endpoint.EXECUTED_TXS)(call, handleResponse),
    })

