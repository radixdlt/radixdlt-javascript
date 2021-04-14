import { Result, ResultAsync } from 'neverthrow'
import {
	handleBuildTransactionResponse,
	handleLookupTXResponse,
	handleNetworkTxDemandResponse,
	handleNetworkTxThroughputResponse,
	handleStakesResponse,
	handleSubmitSignedTransactionResponse,
	handleTokenBalancesResponse,
	handleTokenInfoResponse,
	handleTransactionHistoryResponse,
	handleTransactionStatusResponse,
	handleNetworkIdResponse,
	handleUnstakesResponse,
	handleValidatorsResponse,
	handleFinalizedTransactionResponse,
} from './responseHandlers'
import { andThen, pipe } from 'ramda'
import {
	ApiMethod,
	BuildTransactionEndpoint,
	Endpoint,
	FinalizeTransactionEndpoint,
	LookupTransactionEndpoint,
	NativeTokenEndpoint,
	NetworkIdEndpoint,
	NetworkTransactionDemandEndpoint,
	NetworkTransactionThroughputEndpoint,
	StakePositionsEndpoint,
	SubmitSignedTransactionEndpoint,
	TokenBalancesEndpoint,
	TokenInfoEndpoint,
	TransactionHistoryEndpoint,
	TransactionStatusEndpoint,
	UnstakePositionsEndpoint,
	ValidatorsEndpoint,
} from './_types'

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
	handleResponse: (response: any) => Result<R, Error[]>,
) => (endpoint: Endpoint) => callAPI<I, R>(endpoint)(call, handleResponse)

export const getAPI = (
	call: (endpoint: Endpoint, ...params: unknown[]) => Promise<unknown>,
) => {
	const setupAPIResponse = setupAPICall(call)

	return {
		[ApiMethod.NETWORK_ID]: setupAPIResponse<
			NetworkIdEndpoint.Input,
			NetworkIdEndpoint.DecodedResponse
		>(handleNetworkIdResponse)('radix.networkId'),

		[ApiMethod.TOKEN_BALANCES]: setupAPIResponse<
			TokenBalancesEndpoint.Input,
			TokenBalancesEndpoint.DecodedResponse
		>(handleTokenBalancesResponse)('radix.tokenBalances'),

		[ApiMethod.VALIDATORS]: setupAPIResponse<
			ValidatorsEndpoint.Input,
			ValidatorsEndpoint.DecodedResponse
		>(handleValidatorsResponse)('radix.validators'),

		[ApiMethod.LOOKUP_TX]: setupAPIResponse<
			LookupTransactionEndpoint.Input,
			LookupTransactionEndpoint.DecodedResponse
		>(handleLookupTXResponse)('radix.lookupTransaction'),

		[ApiMethod.TRANSACTION_HISTORY]: setupAPIResponse<
			TransactionHistoryEndpoint.Input,
			TransactionHistoryEndpoint.DecodedResponse
		>(handleTransactionHistoryResponse)('radix.transactionHistory'),

		[ApiMethod.NATIVE_TOKEN]: setupAPIResponse<
			NativeTokenEndpoint.Input,
			NativeTokenEndpoint.DecodedResponse
		>(handleTokenInfoResponse)('radix.nativeToken'),

		[ApiMethod.TOKEN_INFO]: setupAPIResponse<
			TokenInfoEndpoint.Input,
			TokenInfoEndpoint.DecodedResponse
		>(handleTokenInfoResponse)('radix.tokenInfo'),

		[ApiMethod.STAKES]: setupAPIResponse<
			StakePositionsEndpoint.Input,
			StakePositionsEndpoint.DecodedResponse
		>(handleStakesResponse)('radix.stakePositions'),

		[ApiMethod.UNSTAKES]: setupAPIResponse<
			UnstakePositionsEndpoint.Input,
			UnstakePositionsEndpoint.DecodedResponse
		>(handleUnstakesResponse)('radix.stakePositions'),

		[ApiMethod.TX_STATUS]: setupAPIResponse<
			TransactionStatusEndpoint.Input,
			TransactionStatusEndpoint.DecodedResponse
		>(handleTransactionStatusResponse)('radix.transactionStatus'),

		[ApiMethod.NETWORK_TX_THROUGHPUT]: setupAPIResponse<
			NetworkTransactionThroughputEndpoint.Input,
			NetworkTransactionThroughputEndpoint.DecodedResponse
		>(handleNetworkTxThroughputResponse)(
			'radix.networkTransactionThroughput',
		),

		[ApiMethod.NETWORK_TX_DEMAND]: setupAPIResponse<
			NetworkTransactionDemandEndpoint.Input,
			NetworkTransactionDemandEndpoint.DecodedResponse
		>(handleNetworkTxDemandResponse)('radix.networkTransactionDemand'),

		[ApiMethod.BUILD_TX_FROM_INTENT]: setupAPIResponse<
			BuildTransactionEndpoint.Input,
			BuildTransactionEndpoint.DecodedResponse
		>(handleBuildTransactionResponse)('radix.buildTransaction'),

		[ApiMethod.SUBMIT_SIGNED_TX]: setupAPIResponse<
			SubmitSignedTransactionEndpoint.Input,
			SubmitSignedTransactionEndpoint.DecodedResponse
		>(handleSubmitSignedTransactionResponse)(
			'radix.submitSignedTransaction',
		),

		[ApiMethod.FINALIZE_TX]: setupAPIResponse<
			FinalizeTransactionEndpoint.Input,
			FinalizeTransactionEndpoint.DecodedResponse
		>(handleFinalizedTransactionResponse)('radix.finalizeTransaction'),
	}
}
