import {
	ApiMethod,
	ExecutedTransactions,
	NativeToken,
	TokenBalances,
	UniverseMagic,
	TokenFeeForTransaction,
	Stakes,
	TransactionStatus,
	NetworkTransactionDemand,
	NetworkTransactionThroughput,
	GetAtomForTransaction,
	SubmitSignedAtom,
	API_PREFIX,
} from './_types'
import { Result, ResultAsync } from 'neverthrow'
import {
	handleExecutedTransactionsResponse,
	handleGetAtomForTxResponse,
	handleNativeTokenResponse,
	handleNetworkTxDemandResponse,
	handleNetworkTxThroughputResponse,
	handleStakesResponse,
	handleSubmitSignedAtomResponse,
	handleTokenBalancesResponse,
	handleTokenFeeForTxResponse,
	handleTransactionStatusResponse,
	handleUniverseMagicResponse,
} from './responseHandlers'
import { andThen, pipe } from 'ramda'

const callAPI = <Params extends unknown[], DecodedResponse>(
	endpoint: ApiMethod,
) => (
	call: (endpoint: ApiMethod, params: Params) => Promise<unknown>,
	handleResponse: (response: unknown) => Result<DecodedResponse, Error[]>,
) => (...params: Params) =>
	pipe(
		call,
		andThen(handleResponse),
		(value) =>
			// ignore typecheck here because typings in Ramda pipe can't handle the spread operator.
			// @ts-ignore
			ResultAsync.fromPromise(value, (e: Error[]) => e).andThen((r) => r),
		// @ts-ignore
	)(`${API_PREFIX}.${endpoint}`, ...params)

const setupAPICall = (
	call: (endpoint: ApiMethod, ...params: unknown[]) => Promise<unknown>,
) => <I extends unknown[], R>(
	handleResponse: (response: unknown) => Result<R, Error[]>,
) => (endpoint: ApiMethod) => callAPI<I, R>(endpoint)(call, handleResponse)

export const getAPI = (
	call: (endpoint: ApiMethod, ...params: unknown[]) => Promise<unknown>,
) => {
	const setupAPIResponse = setupAPICall(call)

	return {
		[ApiMethod.UNIVERSE_MAGIC]: setupAPIResponse<
			UniverseMagic.Input,
			UniverseMagic.DecodedResponse
		>(handleUniverseMagicResponse)(ApiMethod.UNIVERSE_MAGIC),

		[ApiMethod.TOKEN_BALANCES]: setupAPIResponse<
			TokenBalances.Input,
			TokenBalances.DecodedResponse
		>(handleTokenBalancesResponse)(ApiMethod.TOKEN_BALANCES),

		[ApiMethod.EXECUTED_TXS]: setupAPIResponse<
			ExecutedTransactions.Input,
			ExecutedTransactions.DecodedResponse
		>(handleExecutedTransactionsResponse)(ApiMethod.EXECUTED_TXS),

		[ApiMethod.NATIVE_TOKEN]: setupAPIResponse<
			NativeToken.Input,
			NativeToken.DecodedResponse
		>(handleNativeTokenResponse)(ApiMethod.NATIVE_TOKEN),

		[ApiMethod.TOKEN_FEE_FOR_TX]: setupAPIResponse<
			TokenFeeForTransaction.Input,
			TokenFeeForTransaction.DecodedResponse
		>(handleTokenFeeForTxResponse)(ApiMethod.TOKEN_FEE_FOR_TX),

		[ApiMethod.STAKES]: setupAPIResponse<Stakes.Input, Stakes.DecodedResponse>(
			handleStakesResponse,
		)(ApiMethod.STAKES),

		[ApiMethod.TX_STATUS]: setupAPIResponse<
			TransactionStatus.Input,
			TransactionStatus.DecodedResponse
		>(handleTransactionStatusResponse)(ApiMethod.TX_STATUS),

		[ApiMethod.NETWORK_TX_THROUGHPUT]: setupAPIResponse<
			NetworkTransactionThroughput.Input,
			NetworkTransactionThroughput.DecodedResponse
		>(handleNetworkTxThroughputResponse)(ApiMethod.NETWORK_TX_THROUGHPUT),

		[ApiMethod.NETWORK_TX_DEMAND]: setupAPIResponse<
			NetworkTransactionDemand.Input,
			NetworkTransactionDemand.DecodedResponse
		>(handleNetworkTxDemandResponse)(ApiMethod.NETWORK_TX_DEMAND),

		[ApiMethod.GET_ATOM_FOR_TX]: setupAPIResponse<
			GetAtomForTransaction.Input,
			GetAtomForTransaction.DecodedResponse
		>(handleGetAtomForTxResponse)(ApiMethod.GET_ATOM_FOR_TX),

		[ApiMethod.SUBMIT_SIGNED_ATOM]: setupAPIResponse<
			SubmitSignedAtom.Input,
			SubmitSignedAtom.DecodedResponse
		>(handleSubmitSignedAtomResponse)(ApiMethod.SUBMIT_SIGNED_ATOM),
	}
}
