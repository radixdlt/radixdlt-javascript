import {
	InputOfAPICall,
	MethodName,
	OpenApiClientCall,
	ReturnOfAPICall,
} from '@networking'
import {
	handleAccountBalancesResponse,
	handleNativeTokenResponse,
	handleGatewayResponse,
	handleStakePositionsResponse,
	handleTokenInfoResponse,
	handleUnstakePositionsResponse,
	handleBuildTransactionResponse,
	handleFinalizeTransactionResponse,
	handleSubmitTransactionResponse,
	handleTransactionResponse,
	handleAccountTransactionsResponse,
	handleValidatorResponse,
	handleValidatorsResponse,
} from './responseHandlers'
import { pipe } from 'ramda'
import { Result, ResultAsync } from 'neverthrow'

const callAPIWith =
	(call: OpenApiClientCall) =>
	<M extends MethodName>(method: M) =>
	<DecodedResponse>(
		handleResponse: (
			response: ReturnOfAPICall<M>,
		) => Result<DecodedResponse, Error[]>,
	) =>
	(params: InputOfAPICall<M>): ResultAsync<DecodedResponse, Error[]> =>
		pipe(
			() => call(method, params),
			result => result.mapErr(e => [e]).andThen(handleResponse),
		)()

export const getAPI = pipe(
	(call: OpenApiClientCall) => callAPIWith(call),

	callAPI => ({
		gateway: callAPI('gatewayPost')(handleGatewayResponse),
		tokenInfo: callAPI('tokenPost')(handleTokenInfoResponse),
		nativeTokenInfo: callAPI('tokenNativePost')(handleNativeTokenResponse),
		stakePositions: callAPI('accountStakesPost')(
			handleStakePositionsResponse,
		),
		unstakePositions: callAPI('accountUnstakesPost')(
			handleUnstakePositionsResponse,
		),
		accountBalances: callAPI('accountBalancesPost')(
			handleAccountBalancesResponse,
		),
		accountTransactions: callAPI('accountTransactionsPost')(
			handleAccountTransactionsResponse,
		),
		validator: callAPI('validatorPost')(handleValidatorResponse),
		validators: callAPI('validatorsPost')(handleValidatorsResponse),
		buildTransaction: callAPI('transactionBuildPost')(
			handleBuildTransactionResponse,
		),
		finalizeTransaction: callAPI('transactionFinalizePost')(
			handleFinalizeTransactionResponse,
		),
		submitTransaction: callAPI('transactionSubmitPost')(
			handleSubmitTransactionResponse,
		),
		getTransaction: callAPI('transactionStatusPost')(
			handleTransactionResponse,
		),
	}),
)
