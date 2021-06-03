import { Result, ResultAsync } from 'neverthrow'
import {
	handleBuildTransactionResponse,
	handleLookupTXResponse,
	handleNetworkTxDemandResponse,
	handleNetworkTxThroughputResponse,
	handleStakesResponse,
	handleFinalizeTransactionResponse,
	handleTokenBalancesResponse,
	handleTokenInfoResponse,
	handleTransactionHistoryResponse,
	handleTransactionStatusResponse,
	handleNetworkIdResponse,
	handleUnstakesResponse,
	handleValidatorsResponse,
	handleSubmitTransactionResponse,
	handleLookupValidatorResponse,
} from './responseHandlers'
import { andThen, pipe } from 'ramda'
import {
	Endpoint,
	BuildTransactionEndpoint,
	SubmitTransactionEndpoint,
	LookupTransactionEndpoint,
	NativeTokenEndpoint,
	NetworkIdEndpoint,
	NetworkTransactionDemandEndpoint,
	NetworkTransactionThroughputEndpoint,
	StakePositionsEndpoint,
	FinalizeTransactionEndpoint,
	TokenBalancesEndpoint,
	TokenInfoEndpoint,
	TransactionHistoryEndpoint,
	TransactionStatusEndpoint,
	UnstakePositionsEndpoint,
	ValidatorsEndpoint,
	LookupValidatorEndpoint,
} from './_types'

const callAPI = <Params extends Record<string, unknown>, DecodedResponse>(
	endpoint: Endpoint,
) => (
	call: (endpoint: Endpoint, params: Params) => Promise<unknown>,
	handleResponse: (response: unknown) => Result<DecodedResponse, Error[]>,
) => (params: Params) =>
	pipe(call, andThen(handleResponse), value =>
		// @ts-ignore
		ResultAsync.fromPromise(value, (e: Error[]) => e).andThen(r => r),
	)(endpoint, params)

const setupAPICall = (
	call: (
		endpoint: Endpoint,
		params: Record<string, unknown>,
	) => Promise<unknown>,
) => <I extends Record<string, unknown>, R>(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	handleResponse: (response: any) => Result<R, Error[]>,
) => (endpoint: Endpoint) => callAPI<I, R>(endpoint)(call, handleResponse)

export const getAPI = (
	call: (
		endpoint: Endpoint,
		params: Record<string, unknown>,
	) => Promise<unknown>,
) => {
	const setupAPIResponse = setupAPICall(call)

	return {
		[Endpoint.NETWORK_ID]: setupAPIResponse<
			NetworkIdEndpoint.Input,
			NetworkIdEndpoint.DecodedResponse
		>(handleNetworkIdResponse)(Endpoint.NETWORK_ID),

		[Endpoint.TOKEN_BALANCES]: setupAPIResponse<
			TokenBalancesEndpoint.Input,
			TokenBalancesEndpoint.DecodedResponse
		>(handleTokenBalancesResponse)(Endpoint.TOKEN_BALANCES),

		[Endpoint.VALIDATORS]: setupAPIResponse<
			ValidatorsEndpoint.Input,
			ValidatorsEndpoint.DecodedResponse
		>(handleValidatorsResponse)(Endpoint.VALIDATORS),

		[Endpoint.LOOKUP_TX]: setupAPIResponse<
			LookupTransactionEndpoint.Input,
			LookupTransactionEndpoint.DecodedResponse
		>(handleLookupTXResponse)(Endpoint.LOOKUP_TX),

		[Endpoint.LOOKUP_VALIDATOR]: setupAPIResponse<
			LookupValidatorEndpoint.Input,
			LookupValidatorEndpoint.DecodedResponse
		>(handleLookupValidatorResponse)(Endpoint.LOOKUP_VALIDATOR),

		[Endpoint.TRANSACTION_HISTORY]: setupAPIResponse<
			TransactionHistoryEndpoint.Input,
			TransactionHistoryEndpoint.DecodedResponse
		>(handleTransactionHistoryResponse)(Endpoint.TRANSACTION_HISTORY),

		[Endpoint.NATIVE_TOKEN]: setupAPIResponse<
			NativeTokenEndpoint.Input,
			NativeTokenEndpoint.DecodedResponse
		>(handleTokenInfoResponse)(Endpoint.NATIVE_TOKEN),

		[Endpoint.TOKEN_INFO]: setupAPIResponse<
			TokenInfoEndpoint.Input,
			TokenInfoEndpoint.DecodedResponse
		>(handleTokenInfoResponse)(Endpoint.TOKEN_INFO),

		[Endpoint.STAKES]: setupAPIResponse<
			StakePositionsEndpoint.Input,
			StakePositionsEndpoint.DecodedResponse
		>(handleStakesResponse)(Endpoint.STAKES),

		[Endpoint.UNSTAKES]: setupAPIResponse<
			UnstakePositionsEndpoint.Input,
			UnstakePositionsEndpoint.DecodedResponse
		>(handleUnstakesResponse)(Endpoint.UNSTAKES),

		[Endpoint.TX_STATUS]: setupAPIResponse<
			TransactionStatusEndpoint.Input,
			TransactionStatusEndpoint.DecodedResponse
		>(handleTransactionStatusResponse)(Endpoint.TX_STATUS),

		[Endpoint.NETWORK_TX_THROUGHPUT]: setupAPIResponse<
			NetworkTransactionThroughputEndpoint.Input,
			NetworkTransactionThroughputEndpoint.DecodedResponse
		>(handleNetworkTxThroughputResponse)(Endpoint.NETWORK_TX_THROUGHPUT),

		[Endpoint.NETWORK_TX_DEMAND]: setupAPIResponse<
			NetworkTransactionDemandEndpoint.Input,
			NetworkTransactionDemandEndpoint.DecodedResponse
		>(handleNetworkTxDemandResponse)(Endpoint.NETWORK_TX_DEMAND),

		[Endpoint.BUILD_TX_FROM_INTENT]: setupAPIResponse<
			BuildTransactionEndpoint.Input,
			BuildTransactionEndpoint.DecodedResponse
		>(handleBuildTransactionResponse)(Endpoint.BUILD_TX_FROM_INTENT),

		[Endpoint.FINALIZE_TX]: setupAPIResponse<
			FinalizeTransactionEndpoint.Input,
			FinalizeTransactionEndpoint.DecodedResponse
		>(handleFinalizeTransactionResponse)(Endpoint.FINALIZE_TX),

		[Endpoint.SUBMIT_TX]: setupAPIResponse<
			SubmitTransactionEndpoint.Input,
			SubmitTransactionEndpoint.DecodedResponse
		>(handleSubmitTransactionResponse)(Endpoint.SUBMIT_TX),
	}
}
