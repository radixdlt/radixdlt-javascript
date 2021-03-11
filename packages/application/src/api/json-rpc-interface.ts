import { callAPI } from "./utils"
import { Endpoint, ExecutedTransactions, NativeToken, TokenBalances, UniverseMagic } from "./_types"
import { RadixJSONDecoding } from "./serialization"

const setupAPICall = (
    call: (endpoint: Endpoint, ...params: unknown[]) => Promise<any>
) => <I extends unknown[], R>(
    endpoint: Endpoint
) => callAPI<I, R>(endpoint)(
    call,
    RadixJSONDecoding<R>()
)

export const getAPI = (
    call: (endpoint: Endpoint, ...params: unknown[]) => Promise<any>
) => {
    const setupAPIEndpoint = setupAPICall(call)

    return {
        universeMagic: setupAPIEndpoint<UniverseMagic.Input, UniverseMagic.Response>(Endpoint.UNIVERSE_MAGIC),
        tokenBalances: setupAPIEndpoint<TokenBalances.Input, TokenBalances.Response>(Endpoint.TOKEN_BALANCES),
        executedTransactions: setupAPIEndpoint<ExecutedTransactions.Input, ExecutedTransactions.Response>(Endpoint.EXECUTED_TXS),
        nativeToken: setupAPIEndpoint<NativeToken.Input, NativeToken.Response>(Endpoint.NATIVE_TOKEN),
        
    }
}