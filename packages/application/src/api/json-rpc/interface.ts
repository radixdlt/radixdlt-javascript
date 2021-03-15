import { callAPI } from "../utils"
import { Endpoint, ExecutedTransactions, NativeToken, TokenBalances, UniverseMagic, TokenFeeForTransaction, Stakes, TransactionStatus, NetworkTransactionDemand, NetworkTransactionThroughput } from "./_types"
import { Result } from "neverthrow"
import { handleExecutedTransactionsResponse, handleTokenBalancesResponse, handleUniverseMagicResponse } from './responseHandlers'

const setupAPICall = (
    call: (endpoint: Endpoint, ...params: unknown[]) => Promise<any>,
) => <I extends unknown[], R>(
    handleResponse: (response: unknown) => Result<R, Error[] | Error>
) => (
    endpoint: Endpoint
) => callAPI<I, R>(endpoint)(
    call,
    handleResponse
)

export const getAPI = (
    call: (endpoint: Endpoint, ...params: unknown[]) => Promise<any>
) => {
    const setupAPIResponse = setupAPICall(call)

    return {
        universeMagic: setupAPIResponse<UniverseMagic.Input, UniverseMagic.Response>(handleUniverseMagicResponse)(Endpoint.UNIVERSE_MAGIC),
        tokenBalances: setupAPIResponse<TokenBalances.Input, TokenBalances.Response>(handleTokenBalancesResponse)(Endpoint.TOKEN_BALANCES),
        executedTransactions: setupAPIResponse<ExecutedTransactions.Input, ExecutedTransactions.Response>(handleExecutedTransactionsResponse)(Endpoint.EXECUTED_TXS),
        //nativeToken: setupAPIResponse<NativeToken.Input, NativeToken.Response>(Endpoint.NATIVE_TOKEN),
        //tokenFeeForTransaction: setupAPIResponse<TokenFeeForTransaction.Input, TokenFeeForTransaction.Response>(Endpoint.TOKEN_FEE_FOR_TX),
        //stakes: setupAPIResponse<Stakes.Input, Stakes.Response>(Endpoint.STAKES),
        //transactionStatus: setupAPIResponse<TransactionStatus.Input, TransactionStatus.Response>(Endpoint.TX_STATUS),
        //networkTransactionThroughput: setupAPIResponse<NetworkTransactionThroughput.Input, NetworkTransactionThroughput.Response>(Endpoint.NETWORK_TX_THROUGHPUT),
        //networkTransactionDemand: setupAPIResponse<NetworkTransactionDemand.Input, NetworkTransactionDemand.Response>(Endpoint.NETWORK_TX_DEMAND)
    }
}