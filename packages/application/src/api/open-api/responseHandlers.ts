import { JSONDecoding } from '@radixdlt/data-formats'
import {
	addressDecoder,
	amountDecoder,
	dateDecoder,
	networkDecoder,
	RRIDecoder,
	transactionIdentifierDecoder,
	URLDecoder,
	validatorAddressDecoder,
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
} from './_types'
import { Method } from '@radixdlt/networking'

const tokenDecoders = [
	RRIDecoder('rri'),
	amountDecoder('value', 'granularity'),
	URLDecoder('icon_url', 'url'),
	addressDecoder('address'),
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
	JSONDecoding.withDecoders(
		validatorAddressDecoder('address'),
		RRIDecoder('rri'),
		amountDecoder('value'),
		URLDecoder('url'),
	)
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
