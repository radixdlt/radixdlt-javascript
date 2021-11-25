import { JSONDecoding } from '@radixdlt/data-formats'
import {
	addressDecoder,
	addressObjectDecoder,
	amountDecoder,
	dateDecoder,
	networkDecoder,
	RRIDecoder,
	transactionIdentifierDecoder,
	URLDecoder,
	validatorAddressDecoder,
	validatorAddressObjectDecoder,
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
} from './_types'
import { Method } from '@radixdlt/networking'

const tokenDecoders = [
	RRIDecoder('rri'),
	amountDecoder('value', 'granularity'),
	URLDecoder('icon_url', 'url'),
	addressDecoder('address'),
]

const validatorDecoders = [
	validatorAddressObjectDecoder('validator_identifier'),
	addressObjectDecoder('owner_account_identifier'),
	RRIDecoder('rri'),
	amountDecoder('value'),
	URLDecoder('url'),
]

export const handleNetworkResponse = (
	json: Awaited<ReturnType<Method['networkPost']>>,
) =>
	JSONDecoding.withDecoders(networkDecoder('network'))
		.create<NetworkEndpoint.Response, NetworkEndpoint.DecodedResponse>()(
			json,
		)
		.andThen(decoded =>
			hasRequiredProps('network', decoded, ['network', 'ledger_state']),
		)

export const handleTokenInfoResponse = (
	json: Awaited<ReturnType<Method['tokenPost']>>,
) =>
	JSONDecoding.withDecoders(...tokenDecoders)
		.create<
			TokenInfoEndpoint.Response,
			TokenInfoEndpoint.DecodedResponse
		>()(json)
		.andThen(decoded =>
			hasRequiredProps('tokenInfo', decoded, ['ledger_state', 'token']),
		)

export const handleNativeTokenResponse = (
	json: Awaited<ReturnType<Method['tokenNativePost']>>,
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
	json: Awaited<ReturnType<Method['tokenDerivePost']>>,
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
	json: Awaited<ReturnType<Method['accountBalancesPost']>>,
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
	json: Awaited<ReturnType<Method['accountStakesPost']>>,
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
	json: Awaited<ReturnType<Method['accountUnstakesPost']>>,
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
			hasRequiredProps('stakePositions', decoded, [
				'ledger_state',
				'unstakes',
			]),
		)

export const handleAccountTransactionsResponse = (
	json: Awaited<ReturnType<Method['accountTransactionsPost']>>,
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
			hasRequiredProps('stakePositions', decoded, [
				'ledger_state',
				'total_count',
				'transactions',
			]),
		)

export const handleValidatorResponse = (
	json: Awaited<ReturnType<Method['validatorPost']>>,
) =>
	JSONDecoding.withDecoders(...validatorDecoders)
		.create<
			ValidatorEndpoint.Response,
			ValidatorEndpoint.DecodedResponse
		>()(json)
		.andThen(decoded =>
			hasRequiredProps('stakePositions', decoded, [
				'ledger_state',
				'validator',
			]),
		)

export const handleValidatorsResponse = (
	json: Awaited<ReturnType<Method['validatorsPost']>>,
) =>
	JSONDecoding.withDecoders(...validatorDecoders)
		.create<
			ValidatorsEndpoint.Response,
			ValidatorsEndpoint.DecodedResponse
		>()(json)
		.andThen(decoded =>
			hasRequiredProps('stakePositions', decoded, [
				'ledger_state',
				'validators',
			]),
		)

export const handleTransactionRulesResponse = (
	json: Awaited<ReturnType<Method['transactionRulesPost']>>,
) =>
	JSONDecoding.withDecoders(amountDecoder('value'), RRIDecoder('rri'))
		.create<
			TransactionRulesEndpoint.Response,
			TransactionRulesEndpoint.DecodedResponse
		>()(json)
		.andThen(decoded =>
			hasRequiredProps('stakePositions', decoded, [
				'ledger_state',
				'transaction_rules',
			]),
		)

export const handleBuildTransactionResponse = (
	json: Awaited<ReturnType<Method['transactionBuildPost']>>,
) =>
	JSONDecoding.withDecoders(amountDecoder('value'), RRIDecoder('rri'))
		.create<
			BuildTransactionEndpoint.Response,
			BuildTransactionEndpoint.DecodedResponse
		>()(json)
		.andThen(decoded =>
			hasRequiredProps('stakePositions', decoded, ['transaction_rules']),
		)

export const handleSubmitTransactionResponse = (
	json: Awaited<ReturnType<Method['transactionSubmitPost']>>,
) =>
	JSONDecoding.withDecoders(amountDecoder('value'), RRIDecoder('rri'))
		.create<
			SubmitTransactionEndpoint.Response,
			SubmitTransactionEndpoint.DecodedResponse
		>()(json)
		.andThen(decoded =>
			hasRequiredProps('stakePositions', decoded, ['transaction_rules']),
		)
