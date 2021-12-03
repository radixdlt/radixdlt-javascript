import {
	InputOfAPICall,
	MethodName,
	OpenApiClientCall,
	ReturnOfAPICall,
} from '@radixdlt/networking'
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
		// @ts-ignore: TODO
		tokenInfo: callAPI('tokenPost')(handleTokenInfoResponse),
		// @ts-ignore: TODO
		nativeTokenInfo: callAPI('tokenNativePost')(handleNativeTokenResponse),
		stakePositions: callAPI('accountStakesPost')(
			// @ts-ignore: TODO
			handleStakePositionsResponse,
		),
		unstakePositions: callAPI('accountUnstakesPost')(
			// @ts-ignore: TODO
			handleUnstakePositionsResponse,
		),
		/*
		deriveTokenIdentifier: callAPI('tokenDerivePost')(
			handleDeriveTokenIdentifierResponse,
		),
		*/
		accountBalances: callAPI('accountBalancesPost')(
			// @ts-ignore: TODO
			handleAccountBalancesResponse,
		),
		accountTransactions: callAPI('accountTransactionsPost')(
			// @ts-ignore: TODO
			handleAccountTransactionsResponse,
		),
		// @ts-ignore: TODO
		validator: callAPI('validatorPost')(handleValidatorResponse),
		// @ts-ignore: TODO
		validators: callAPI('validatorsPost')(handleValidatorsResponse),
		/*
		transactionRules: callAPI('transactionRulesPost')(
			handleTransactionRulesResponse,
		),
		*/
		buildTransaction: callAPI('transactionBuildPost')(
			// @ts-ignore: TODO
			handleBuildTransactionResponse,
		),
		finalizeTransaction: callAPI('transactionFinalizePost')(
			// @ts-ignore: TODO
			handleFinalizeTransactionResponse,
		),
		submitTransaction: callAPI('transactionSubmitPost')(
			// @ts-ignore: TODO
			handleSubmitTransactionResponse,
		),
		getTransaction: callAPI('transactionStatusPost')(
			// @ts-ignore: TODO
			handleTransactionResponse,
		),
	}),
)
