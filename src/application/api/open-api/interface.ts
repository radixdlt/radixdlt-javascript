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
import { RadixError } from '@util'

const callAPIWith =
  (call: OpenApiClientCall) =>
  <M extends MethodName>(method: M) =>
  <DecodedResponse>(
    handleResponse: (
      response: ReturnOfAPICall<M>,
    ) => Result<DecodedResponse, RadixError[]>,
  ) =>
  (params: InputOfAPICall<M>): ResultAsync<DecodedResponse, RadixError[]> =>
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
    stakePositions: callAPI('accountStakesPost')(handleStakePositionsResponse),
    unstakePositions: callAPI('accountUnstakesPost')(
      handleUnstakePositionsResponse,
    ),
    /*
		deriveTokenIdentifier: callAPI('tokenDerivePost')(
			handleDeriveTokenIdentifierResponse,
		),
		*/
    accountBalances: callAPI('accountBalancesPost')(
      handleAccountBalancesResponse,
    ),
    accountTransactions: callAPI('accountTransactionsPost')(
      handleAccountTransactionsResponse,
    ),
    validator: callAPI('validatorPost')(handleValidatorResponse),
    validators: callAPI('validatorsPost')(handleValidatorsResponse),
    /*
		transactionRules: callAPI('transactionRulesPost')(
			handleTransactionRulesResponse,
		),
		*/
    buildTransaction: callAPI('transactionBuildPost')(
      handleBuildTransactionResponse,
    ),
    finalizeTransaction: callAPI('transactionFinalizePost')(
      handleFinalizeTransactionResponse,
    ),
    submitTransaction: callAPI('transactionSubmitPost')(
      handleSubmitTransactionResponse,
    ),
    getTransaction: callAPI('transactionStatusPost')(handleTransactionResponse),
  }),
)
