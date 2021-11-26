import { JSONDecoding } from '@radixdlt/data-formats'
import {
	addressDecoder,
	amountDecoder,
	networkDecoder,
	RRIDecoder,
	transactionIdentifierDecoder,
	URLDecoder,
	validatorAddressDecoder,
	addressRegexDecoder,
} from '../decoders'
import { hasRequiredProps } from '../utils'
import {
	NetworkEndpoint,
	TokenInfoEndpoint,
	NativeTokenInfoEndpoint,
	DeriveTokenIdentifierEndpoint,
	AccountBalancesEndpoint,
	StakePositionsEndpoint,
	UnstakePositionsEndpoint,
	AccountTransactionsEndpoint,
	ValidatorEndpoint,
	ValidatorsEndpoint,
	TransactionRulesEndpoint,
	BuildTransactionEndpoint,
	SubmitTransactionEndpoint,
	FinalizeTransactionEndpoint,
	TransactionEndpoint,
} from './_types'
import { ReturnOfAPICall } from '@radixdlt/networking'

const tokenDecoders = [
	RRIDecoder('rri'),
	amountDecoder('value', 'granularity'),
	URLDecoder('icon_url', 'url'),
	addressDecoder('address'),
]

const validatorDecoders = [
	addressRegexDecoder('address'),
	RRIDecoder('rri'),
	amountDecoder('value'),
	URLDecoder('url'),
]

export const handleNetworkResponse = (json: ReturnOfAPICall<'networkPost'>) =>
	JSONDecoding.withDecoders(networkDecoder('network'))
		.create<NetworkEndpoint.Response, NetworkEndpoint.DecodedResponse>()(
			json,
		)
		.andThen(decoded =>
			hasRequiredProps('network', decoded, ['network', 'ledger_state']),
		)

export const handleTokenInfoResponse = (json: ReturnOfAPICall<'tokenPost'>) =>
	JSONDecoding.withDecoders(...tokenDecoders)
		.create<
			TokenInfoEndpoint.Response,
			TokenInfoEndpoint.DecodedResponse
		>()(json)
		.andThen(decoded =>
			hasRequiredProps('tokenInfo', decoded, ['ledger_state', 'token']),
		)

export const handleNativeTokenResponse = (
	json: ReturnOfAPICall<'tokenNativePost'>,
) =>
	JSONDecoding.withDecoders(...tokenDecoders)
		.create<
			NativeTokenInfoEndpoint.Response,
			NativeTokenInfoEndpoint.DecodedResponse
		>()(json)
		.andThen(decoded =>
			hasRequiredProps('nativeTokenInfo', decoded, [
				'ledger_state',
				'token',
			]),
		)

export const handleDeriveTokenIdentifierResponse = (
	json: ReturnOfAPICall<'tokenDerivePost'>,
) =>
	JSONDecoding.withDecoders(RRIDecoder('rri'))
		.create<
			DeriveTokenIdentifierEndpoint.Response,
			DeriveTokenIdentifierEndpoint.DecodedResponse
		>()(json)
		.andThen(decoded =>
			hasRequiredProps('deriveTokenIdentifier', decoded, [
				'token_identifier',
			]),
		)

export const handleAccountBalancesResponse = (
	json: ReturnOfAPICall<'accountBalancesPost'>,
) =>
	JSONDecoding.withDecoders(RRIDecoder('rri'), amountDecoder('value'))
		.create<
			AccountBalancesEndpoint.Response,
			AccountBalancesEndpoint.DecodedResponse
		>()(json)
		.andThen(decoded =>
			hasRequiredProps('accountBalances', decoded, [
				'ledger_state',
				'account_balances',
			]),
		)

export const handleStakePositionsResponse = (
	json: ReturnOfAPICall<'accountStakesPost'>,
) =>
	JSONDecoding.withDecoders(
		RRIDecoder('rri'),
		amountDecoder('value'),
		validatorAddressDecoder('address'),
	)
		.create<
			StakePositionsEndpoint.Response,
			StakePositionsEndpoint.DecodedResponse
		>()(json)
		.andThen(decoded =>
			hasRequiredProps('stakePositions', decoded, [
				'ledger_state',
				'stakes',
			]),
		)

export const handleUnstakePositionsResponse = (
	json: ReturnOfAPICall<'accountUnstakesPost'>,
) =>
	JSONDecoding.withDecoders(
		RRIDecoder('rri'),
		amountDecoder('value'),
		validatorAddressDecoder('address'),
	)
		.create<
			UnstakePositionsEndpoint.Response,
			UnstakePositionsEndpoint.DecodedResponse
		>()(json)
		.andThen(decoded =>
			hasRequiredProps('unstakePositions', decoded, [
				'ledger_state',
				'unstakes',
			]),
		)

export const handleAccountTransactionsResponse = (
	json: ReturnOfAPICall<'accountTransactionsPost'>,
) =>
	JSONDecoding.withDecoders(
		transactionIdentifierDecoder('hash'),
		...tokenDecoders,
	)
		.create<
			AccountTransactionsEndpoint.Response,
			AccountTransactionsEndpoint.DecodedResponse
		>()(json)
		.andThen(decoded =>
			hasRequiredProps('accountTransactions', decoded, [
				'ledger_state',
				'total_count',
				'transactions',
			]),
		)

export const handleValidatorResponse = (
	json: ReturnOfAPICall<'validatorPost'>,
) =>
	JSONDecoding.withDecoders(...validatorDecoders)
		.create<
			ValidatorEndpoint.Response,
			ValidatorEndpoint.DecodedResponse
		>()(json)
		.andThen(decoded =>
			hasRequiredProps('validator', decoded, [
				'ledger_state',
				'validator',
			]),
		)

export const handleValidatorsResponse = (
	json: ReturnOfAPICall<'validatorsPost'>,
) =>
	JSONDecoding.withDecoders(...validatorDecoders)
		.create<
			ValidatorsEndpoint.Response,
			ValidatorsEndpoint.DecodedResponse
		>()(json)
		.andThen(decoded =>
			hasRequiredProps('validators', decoded, [
				'ledger_state',
				'validators',
			]),
		)

export const handleTransactionRulesResponse = (
	json: ReturnOfAPICall<'transactionRulesPost'>,
) =>
	JSONDecoding.withDecoders(amountDecoder('value'), RRIDecoder('rri'))
		.create<
			TransactionRulesEndpoint.Response,
			TransactionRulesEndpoint.DecodedResponse
		>()(json)
		.andThen(decoded =>
			hasRequiredProps('transactionRules', decoded, [
				'ledger_state',
				'transaction_rules',
			]),
		)

export const handleBuildTransactionResponse = (
	json: ReturnOfAPICall<'transactionBuildPost'>,
) =>
	JSONDecoding.withDecoders(amountDecoder('value'), RRIDecoder('rri'))
		.create<
			BuildTransactionEndpoint.Response,
			BuildTransactionEndpoint.DecodedResponse
		>()(json)
		.andThen(decoded =>
			hasRequiredProps('buildTransaction', decoded, ['type']),
		)

export const handleFinalizeTransactionResponse = (
	json: ReturnOfAPICall<'transactionFinalizePost'>,
) =>
	JSONDecoding.withDecoders()
		.create<
			FinalizeTransactionEndpoint.Response,
			FinalizeTransactionEndpoint.DecodedResponse
		>()(json)
		.andThen(decoded =>
			hasRequiredProps('finalizeTransaction', decoded, [
				'signed_transaction',
			]),
		)

export const handleSubmitTransactionResponse = (
	json: ReturnOfAPICall<'transactionSubmitPost'>,
) =>
	JSONDecoding.withDecoders(transactionIdentifierDecoder('hash'))
		.create<
			SubmitTransactionEndpoint.Response,
			SubmitTransactionEndpoint.DecodedResponse
		>()(json)
		.andThen(decoded =>
			hasRequiredProps('submitTransaction', decoded, [
				'transaction_identifier',
			]),
		)

export const handleTransactionResponse = (
	json: ReturnOfAPICall<'transactionStatusPost'>,
) =>
	JSONDecoding.withDecoders(
		transactionIdentifierDecoder('hash'),
		addressRegexDecoder('address'),
		RRIDecoder('rri'),
		amountDecoder('value', 'granularity'),
		URLDecoder('url'),
	)
		.create<
			TransactionEndpoint.Response,
			TransactionEndpoint.DecodedResponse
		>()(json)
		.andThen(decoded =>
			hasRequiredProps('transaction', decoded, [
				'ledger_state',
				'transaction',
			]),
		)
