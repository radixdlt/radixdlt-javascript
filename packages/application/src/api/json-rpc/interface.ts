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
	Endpoint
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
	endpoint: Endpoint,
) => (
	call: (endpoint: Endpoint, params: Params) => Promise<unknown>,
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
	)(endpoint, ...params)

const setupAPICall = (
	call: (endpoint: Endpoint, ...params: unknown[]) => Promise<unknown>,
) => <I extends unknown[], R>(
	handleResponse: (response: unknown) => Result<R, Error[]>,
) => (endpoint: Endpoint) => callAPI<I, R>(endpoint)(call, handleResponse)

export const getAPI = (
	call: (endpoint: Endpoint, ...params: unknown[]) => Promise<unknown>,
) => {
	const setupAPIResponse = setupAPICall(call)

	return {
		[ApiMethod.UNIVERSE_MAGIC]: setupAPIResponse<
			UniverseMagic.Input,
			UniverseMagic.DecodedResponse
		>(handleUniverseMagicResponse)('radix.universeMagic'),

		[ApiMethod.TOKEN_BALANCES]: setupAPIResponse<
			TokenBalances.Input,
			TokenBalances.DecodedResponse
		>(handleTokenBalancesResponse)('radix.tokenBalances'),

		[ApiMethod.EXECUTED_TXS]: setupAPIResponse<
			ExecutedTransactions.Input,
			ExecutedTransactions.DecodedResponse
		>(handleExecutedTransactionsResponse)('radix.executedTransactions'),

		[ApiMethod.NATIVE_TOKEN]: setupAPIResponse<
			NativeToken.Input,
			NativeToken.DecodedResponse
		>(handleNativeTokenResponse)('radix.nativeToken'),

		[ApiMethod.TOKEN_FEE_FOR_TX]: setupAPIResponse<
			TokenFeeForTransaction.Input,
			TokenFeeForTransaction.DecodedResponse
		>(handleTokenFeeForTxResponse)('radix.tokenFeeForTransaction'),

		[ApiMethod.STAKES]: setupAPIResponse<
			Stakes.Input,
			Stakes.DecodedResponse
		>(handleStakesResponse)('radix.stakes'),

		[ApiMethod.TX_STATUS]: setupAPIResponse<
			TransactionStatus.Input,
			TransactionStatus.DecodedResponse
		>(handleTransactionStatusResponse)('radix.transactionStatus'),

		[ApiMethod.NETWORK_TX_THROUGHPUT]: setupAPIResponse<
			NetworkTransactionThroughput.Input,
			NetworkTransactionThroughput.DecodedResponse
		>(handleNetworkTxThroughputResponse)(
			'radix.networkTransactionThroughput',
		),

		[ApiMethod.NETWORK_TX_DEMAND]: setupAPIResponse<
			NetworkTransactionDemand.Input,
			NetworkTransactionDemand.DecodedResponse
		>(handleNetworkTxDemandResponse)('radix.networkTransactionDemand'),

		[ApiMethod.GET_ATOM_FOR_TX]: setupAPIResponse<
			GetAtomForTransaction.Input,
			GetAtomForTransaction.DecodedResponse
		>(handleGetAtomForTxResponse)('radix.getAtomForTransaction'),

		[ApiMethod.SUBMIT_SIGNED_ATOM]: setupAPIResponse<
			SubmitSignedAtom.Input,
			SubmitSignedAtom.DecodedResponse
		>(handleSubmitSignedAtomResponse)('radix.submitSignedAtom'),
	}
}
