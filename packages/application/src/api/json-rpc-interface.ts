import { JSONDecoding, Decoder } from "@radixdlt/data-formats"
import { callAPI } from "./utils"
import { Endpoint, ExecutedTransactionsInput, ExecutedTransactionsResponse, TokenBalancesInput, TokenBalancesResponse } from "./_types"
import { isArray } from '@radixdlt/util'

const actionsDecoder: Decoder = (value, key) => 
    key === 'actions' && isArray(value)
    ? value.map(action => )
    : undefined

const handleTokenBalanceResponse = (response: Record<string, unknown>) => {


    JSONDecoding.withDecoders(

    )
}

export const getAPI = (
    call: (endpoint: Endpoint, ...params: unknown[]) => Promise<any>, handleResponse: (response: unknown) => any
) =>
    ({
        tokenBalances: callAPI<TokenBalancesInput, TokenBalancesResponse>(Endpoint.TOKEN_BALANCES)(call, handleResponse),
        executedTransactions: callAPI<ExecutedTransactionsInput, ExecutedTransactionsResponse>(Endpoint.EXECUTED_TXS)(call, handleResponse),
    })