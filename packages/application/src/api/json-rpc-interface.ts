import { JSONDecoding } from "@radixdlt/data-formats"
import { callAPI } from "./utils"
import { Endpoint, ExecutedTransactionsInput, ExecutedTransactionsResponse, TokenBalancesInput, TokenBalancesResponse } from "./_types"
import { actionDecoder, tokenFeeDecoder } from "./decoders"
import { ok } from "neverthrow"

const handleExecutedTransactionsResponse = (response: unknown) => {
    const { fromJSON } = JSONDecoding.withDecoders(
        actionDecoder,
        tokenFeeDecoder
    ).create<ExecutedTransactionsResponse>()
    
    return fromJSON(response)
}

// placeholder
const handleTokenBalancesResponse = (response: unknown) => ok(response as TokenBalancesResponse)

export const getAPI = (
    call: (endpoint: Endpoint, ...params: unknown[]) => Promise<any>
) =>
    ({
        tokenBalances: callAPI<TokenBalancesInput, TokenBalancesResponse>(Endpoint.TOKEN_BALANCES)(call, handleTokenBalancesResponse as any),
        executedTransactions: callAPI<ExecutedTransactionsInput, ExecutedTransactionsResponse>(Endpoint.EXECUTED_TXS)(call, handleExecutedTransactionsResponse),
    })