import {
	InputOfAPICall,
	MethodName,
	OpenApiClientCall,
	ReturnOfAPICall,
} from '@radixdlt/networking'
import {
	handleNetworkResponse,
	handleTokenInfoResponse,
	handleNativeTokenResponse,
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
		network: callAPI('networkPost')(handleNetworkResponse),
		tokenInfo: callAPI('tokenPost')(handleTokenInfoResponse),
		nativeTokenInfo: callAPI('tokenNativePost')(handleNativeTokenResponse),
		/*
		deriveTokenIdentifier: callAPI('tokenDerivePost')(
			handleDeriveTokenIdentifierResponse,
		),
		accountBalances: callAPI('accountBalancesPost')(
			handleAccountBalancesResponse,
		),
		stakePositions: callAPI('accountStakesPost')(
			handleStakePositionsResponse,
		),
		unstakePositions: callAPI('accountUnstakesPost')(
			handleUnstakePositionsResponse,
		),
		accountTransactions: callAPI('accountTransactionsPost')(
			handleAccountTransactionsResponse,
		),
		validator: callAPI('validatorPost')(handleValidatorResponse),
		validators: callAPI('validatorsPost')(handleValidatorsResponse),
		transactionRules: callAPI('transactionRulesPost')(
			handleTransactionRulesResponse,
		),
		buildTransaction: callAPI('transactionBuildPost')(
			handleBuildTransactionResponse,
		),
		finalizeTransaction: callAPI('transactionFinalizePost')(
			handleFinalizeTransactionResponse,
		),
		submitTransaction: callAPI('transactionSubmitPost')(
			handleSubmitTransactionResponse,
		),
		transactionStatus: callAPI('transactionStatusPost')(
			handleTransactionResponse,
		),
		*/
	}),
)
