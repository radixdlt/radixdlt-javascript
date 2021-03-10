import { JSONDecoding } from "@radixdlt/data-formats"
import { callAPI } from "./utils"
import { Endpoint, ExecutedTransactionsInput, ExecutedTransactionsResponse, TokenBalancesInput, TokenBalancesResponse, UniverseMagicInput, UniverseMagicResponse } from "./_types"
import { actionDecoder, tokenFeeDecoder } from "./decoders"
import { ok, Result } from "neverthrow"

const handleUniverseMagicResponse = (response: unknown): Result<UniverseMagicResponse, Error[]> => ok(response as UniverseMagicResponse)

const handleExecutedTransactionsResponse = (response: unknown) => 
    JSONDecoding.withDecoders(
        actionDecoder,
        tokenFeeDecoder
    ).create<ExecutedTransactionsResponse>()
    .fromJSON(response)

const handleTokenBalancesResponse = (response: unknown): Result<TokenBalancesResponse, Error[]> => ok(response as TokenBalancesResponse)

const handleNativeTokenResponse = (response: unknown) => 
    JSONDecoding.withDecoders(
        
    )

export const getAPI = (
    call: (endpoint: Endpoint, ...params: unknown[]) => Promise<any>
) =>
    ({
        universeMagic: callAPI<UniverseMagicInput, UniverseMagicResponse>(Endpoint.UNIVERSE_MAGIC)(call, handleUniverseMagicResponse),
        tokenBalances: callAPI<TokenBalancesInput, TokenBalancesResponse>(Endpoint.TOKEN_BALANCES)(call, handleTokenBalancesResponse),
        executedTransactions: callAPI<ExecutedTransactionsInput, ExecutedTransactionsResponse>(Endpoint.EXECUTED_TXS)(call, handleExecutedTransactionsResponse),
    })