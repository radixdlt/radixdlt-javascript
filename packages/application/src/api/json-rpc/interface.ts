import { Result, ResultAsync } from 'neverthrow'
import {
	handleBuildTransactionResponse,
	handleLookupTXResponse,
	handleNetworkxDemandResponse,
	handleNetworkxThroughputResponse,
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
import { Method } from '@radixdlt/networking'

const callAPI = <Params extends Record<string, unknown>, DecodedResponse>(
	endpoint: Method,
) => (
	call: (endpoint: Method, params: Params) => Promise<unknown>,
	handleResponse: (response: unknown) => Result<DecodedResponse, Error[]>,
) => (params: Params) =>
	pipe(call, andThen(handleResponse), value =>
		// @ts-ignore
		ResultAsync.fromPromise(value, (e: Error[]) => e).andThen(r => r),
	)(endpoint, params)

const setupAPICall = (
	call: (
		endpoint: Method,
		params: Record<string, unknown>,
	) => Promise<unknown>,
) => <I extends Record<string, unknown>, R>(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	handleResponse: (response: any) => Result<R, Error[]>,
) => (endpoint: Method) => callAPI<I, R>(endpoint)(call, handleResponse)

export const getAPI = (
	call: (
		endpoint: Method,
		params: Record<string, unknown>,
	) => Promise<unknown>,
) => {
	const setupAPIResponse = setupAPICall(call)

	return {
		[Method.NETWORK_ID]: setupAPIResponse<
			NetworkIdEndpoint.Input,
			NetworkIdEndpoint.DecodedResponse
		>(handleNetworkIdResponse)(Method.NETWORK_ID),

		[Method.TOKEN_BALANCES]: setupAPIResponse<
			TokenBalancesEndpoint.Input,
			TokenBalancesEndpoint.DecodedResponse
		>(handleTokenBalancesResponse)(Method.TOKEN_BALANCES),

		[Method.VALIDATORS]: setupAPIResponse<
			ValidatorsEndpoint.Input,
			ValidatorsEndpoint.DecodedResponse
		>(handleValidatorsResponse)(Method.VALIDATORS),

		[Method.LOOKUP_TX]: setupAPIResponse<
			LookupTransactionEndpoint.Input,
			LookupTransactionEndpoint.DecodedResponse
		>(handleLookupTXResponse)(Method.LOOKUP_TX),

		[Method.LOOKUP_VALIDATOR]: setupAPIResponse<
			LookupValidatorEndpoint.Input,
			LookupValidatorEndpoint.DecodedResponse
		>(handleLookupValidatorResponse)(Method.LOOKUP_VALIDATOR),

		[Method.TRANSACTION_HISTORY]: setupAPIResponse<
			TransactionHistoryEndpoint.Input,
			TransactionHistoryEndpoint.DecodedResponse
		>(handleTransactionHistoryResponse)(Method.TRANSACTION_HISTORY),

		[Method.NATIVE_TOKEN]: setupAPIResponse<
			NativeTokenEndpoint.Input,
			NativeTokenEndpoint.DecodedResponse
		>(handleTokenInfoResponse)(Method.NATIVE_TOKEN),

		[Method.TOKEN_INFO]: setupAPIResponse<
			TokenInfoEndpoint.Input,
			TokenInfoEndpoint.DecodedResponse
		>(handleTokenInfoResponse)(Method.TOKEN_INFO),

		[Method.STAKES]: setupAPIResponse<
			StakePositionsEndpoint.Input,
			StakePositionsEndpoint.DecodedResponse
		>(handleStakesResponse)(Method.STAKES),

		[Method.UNSTAKES]: setupAPIResponse<
			UnstakePositionsEndpoint.Input,
			UnstakePositionsEndpoint.DecodedResponse
		>(handleUnstakesResponse)(Method.UNSTAKES),

		[Method.TX_STATUS]: setupAPIResponse<
			TransactionStatusEndpoint.Input,
			TransactionStatusEndpoint.DecodedResponse
		>(handleTransactionStatusResponse)(Method.TX_STATUS),

		[Method.NETWORK_TX_THROUGHPUT]: setupAPIResponse<
			NetworkTransactionThroughputEndpoint.Input,
			NetworkTransactionThroughputEndpoint.DecodedResponse
		>(handleNetworkxThroughputResponse)(Method.NETWORK_TX_THROUGHPUT),

		[Method.NETWORK_TX_DEMAND]: setupAPIResponse<
			NetworkTransactionDemandEndpoint.Input,
			NetworkTransactionDemandEndpoint.DecodedResponse
		>(handleNetworkxDemandResponse)(Method.NETWORK_TX_DEMAND),

		[Method.BUILD_TX_FROM_INTENT]: setupAPIResponse<
			BuildTransactionEndpoint.Input,
			BuildTransactionEndpoint.DecodedResponse
		>(handleBuildTransactionResponse)(Method.BUILD_TX_FROM_INTENT),

		[Method.FINALIZE_TX]: setupAPIResponse<
			FinalizeTransactionEndpoint.Input,
			FinalizeTransactionEndpoint.DecodedResponse
		>(handleFinalizeTransactionResponse)(Method.FINALIZE_TX),

		[Method.SUBMIT_TX]: setupAPIResponse<
			SubmitTransactionEndpoint.Input,
			SubmitTransactionEndpoint.DecodedResponse
		>(handleSubmitTransactionResponse)(Method.SUBMIT_TX),
	}
}
