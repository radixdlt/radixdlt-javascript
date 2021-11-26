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
	dateDecoder,
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
import { Result } from 'neverthrow'
import {
	ResourceIdentifier,
	ResourceIdentifierT,
	ValidatorAddress,
	ValidatorAddressT,
} from '@radixdlt/account'
import {
	Amount,
	AmountOrUnsafeInput,
	AmountT,
	NetworkName,
} from '../../../../primitives'
import { Token } from '../..'
import { ok, combine } from 'neverthrow'

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
	ok({
		// @ts-ignore
		network: NetworkName[json.network] as Network,
	}).mapErr(e => [e] as Error[])

export const handleTokenInfoResponse = (
	json: ReturnOfAPICall<'tokenPost'>,
): Result<Token, Error[]> =>
	combine([
		ResourceIdentifier.fromUnsafe(json.token[0].tokenIdentifier.rri),
		Amount.fromUnsafe(json.token[0].tokenProperties.granularity),
		Amount.fromUnsafe(json.token[0].tokenSupply.value),
	])
		.map(values => ({
			name: json.token[0].tokenProperties.name ?? '',
			rri: values[0] as ResourceIdentifierT,
			symbol: json.token[0].tokenProperties.symbol,
			description: json.token[0].tokenProperties.description,
			granularity: values[1] as AmountT,
			isSupplyMutable: json.token[0].tokenProperties.isSupplyMutable,
			currentSupply: values[2] as AmountT,
			tokenInfoURL: json.token[0].tokenProperties.url
				? new URL(json.token[0].tokenProperties.url)
				: undefined,
			iconURL: json.token[0].tokenProperties.iconUrl
				? new URL(json.token[0].tokenProperties.iconUrl)
				: undefined,
		}))
		.mapErr(e => [e])

export const handleNativeTokenResponse = (
	json: ReturnOfAPICall<'tokenNativePost'>,
) =>
	combine([
		ResourceIdentifier.fromUnsafe(json.token[0].tokenIdentifier.rri),
		Amount.fromUnsafe(json.token[0].tokenProperties.granularity),
		Amount.fromUnsafe(json.token[0].tokenSupply.value),
	])
		.map(values => ({
			name: json.token[0].tokenProperties.name ?? '',
			rri: values[0] as ResourceIdentifierT,
			symbol: json.token[0].tokenProperties.symbol,
			description: json.token[0].tokenProperties.description,
			granularity: values[1] as AmountT,
			isSupplyMutable: json.token[0].tokenProperties.isSupplyMutable,
			currentSupply: values[2] as AmountT,
			tokenInfoURL: json.token[0].tokenProperties.url
				? new URL(json.token[0].tokenProperties.url)
				: undefined,
			iconURL: json.token[0].tokenProperties.iconUrl
				? new URL(json.token[0].tokenProperties.iconUrl)
				: undefined,
		}))
		.mapErr(e => [e])

export const handleStakePositionsResponse = (
	json: ReturnOfAPICall<'accountStakesPost'>,
) =>
	combine(
		json.stakes.map(stake =>
			combine([
				ValidatorAddress.fromUnsafe(stake.validatorIdentifier.address),
				Amount.fromUnsafe(stake.delegatedStake.value),
			]).map(value => ({
				validator: value[0] as ValidatorAddressT,
				amount: value[1] as AmountT,
			})),
		),
	).mapErr(e => [e])

/*
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
	JSONDecoding.withDecoders(
		RRIDecoder('rri'),
		amountDecoder('value'),
		dateDecoder('timestamp'),
	)
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
		dateDecoder('timestamp'),
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
		dateDecoder('timestamp'),
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
		dateDecoder('timestamp'),
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
	JSONDecoding.withDecoders(...validatorDecoders, dateDecoder('timestamp'))
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
	JSONDecoding.withDecoders(...validatorDecoders, dateDecoder('timestamp'))
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
	JSONDecoding.withDecoders(
		amountDecoder('value'),
		RRIDecoder('rri'),
		dateDecoder('timestamp'),
	)
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
	JSONDecoding.withDecoders(
		amountDecoder('value'),
		RRIDecoder('rri'),
		dateDecoder('timestamp'),
	)
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
		dateDecoder('timestamp'),
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
*/
