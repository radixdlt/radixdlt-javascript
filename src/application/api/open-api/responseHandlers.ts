import {
	TokenInfoEndpoint,
	NativeTokenInfoEndpoint,
	AccountBalancesEndpoint,
	BuildTransactionEndpoint,
	FinalizeTransactionEndpoint,
	TransactionEndpoint,
	Decoded,
	StakePositionsEndpoint,
	UnstakePositionsEndpoint,
	AccountTransactionsEndpoint,
	ValidatorEndpoint,
	ValidatorsEndpoint,
	GatewayEndpoint,
} from './_types'
import { AccountUnstakeEntry, ReturnOfAPICall } from '@networking'
import { Result } from 'neverthrow'
import {
	ResourceIdentifier,
	ResourceIdentifierT,
	ValidatorAddress,
	ValidatorAddressT,
} from '@account'
import { Amount, AmountT, Network } from '@primitives'
import { SimpleTransactionHistory, TransactionIdentifier } from '../..'
import { ok, combine } from 'neverthrow'
import { responseHelper } from './responseHelpers'
import { transformAction } from 'src/application/actions'

export const handleGatewayResponse = (
	json: ReturnOfAPICall<'gatewayPost'>,
): Result<GatewayEndpoint.DecodedResponse, Error[]> =>
	ok({
		network: json.data.network_identifier.network as Network,
	}).mapErr(e => [e] as Error[])

export const handleTokenInfoResponse = (
	json: ReturnOfAPICall<'tokenPost'>,
): Result<TokenInfoEndpoint.DecodedResponse, Error[]> =>
	combine([
		ResourceIdentifier.fromUnsafe(json.data.token.token_identifier.rri),
		Amount.fromUnsafe(json.data.token.token_properties.granularity),
		Amount.fromUnsafe(json.data.token.token_supply.value),
	])
		.map(values => ({
			name: json.data.token.token_properties.name ?? '',
			rri: values[0] as ResourceIdentifierT,
			symbol: json.data.token.token_properties.symbol,
			description: json.data.token.token_properties.description,
			granularity: values[1] as AmountT,
			isSupplyMutable: json.data.token.token_properties.is_supply_mutable,
			currentSupply: values[2] as AmountT,
			tokenInfoURL: json.data.token.token_properties.url
				? new URL(json.data.token.token_properties.url)
				: undefined,
			iconURL: json.data.token.token_properties.icon_url
				? new URL(json.data.token.token_properties.icon_url)
				: undefined,
		}))
		.mapErr(e => [e])

export const handleNativeTokenResponse = (
	json: ReturnOfAPICall<'tokenNativePost'>,
): Result<NativeTokenInfoEndpoint.DecodedResponse, Error[]> =>
	combine([
		ResourceIdentifier.fromUnsafe(json.data.token.token_identifier.rri),
		Amount.fromUnsafe(json.data.token.token_properties.granularity),
		Amount.fromUnsafe(json.data.token.token_supply.value),
	])
		.map(values => ({
			name: json.data.token.token_properties.name ?? '',
			rri: values[0] as ResourceIdentifierT,
			symbol: json.data.token.token_properties.symbol,
			description: json.data.token.token_properties.description,
			granularity: values[1] as AmountT,
			isSupplyMutable: json.data.token.token_properties.is_supply_mutable,
			currentSupply: values[2] as AmountT,
			tokenInfoURL: json.data.token.token_properties.url
				? new URL(json.data.token.token_properties.url)
				: undefined,
			iconURL: json.data.token.token_properties.icon_url
				? new URL(json.data.token.token_properties.icon_url)
				: undefined,
		}))
		.mapErr(e => [e])

export const handleStakePositionsResponse = (
	json: ReturnOfAPICall<'accountStakesPost'>,
): Result<StakePositionsEndpoint.DecodedResponse, Error[]> =>
	combine(json.data.stakes.map(responseHelper.transformStakeEntry))
		.andThen(stakes =>
			combine(
				json.data.pending_stakes.map(
					responseHelper.transformStakeEntry,
				),
			).map(pendingStakes => ({ stakes, pendingStakes })),
		)
		.mapErr(e => [e])

const transformUnstakeEntry = (item: AccountUnstakeEntry) =>
	combine([
		ValidatorAddress.fromUnsafe(item.validator_identifier.address),
		Amount.fromUnsafe(item.unstaking_amount.value),
		ok<number, Error>(item.epochs_until_unlocked),
	]).map(value => ({
		validator: value[0] as ValidatorAddressT,
		amount: value[1] as AmountT,
		epochsUntil: value[2] as number,
	}))

export const handleUnstakePositionsResponse = (
	json: ReturnOfAPICall<'accountUnstakesPost'>,
): Result<UnstakePositionsEndpoint.DecodedResponse, Error[]> => {
	return combine(json.data.pending_unstakes.map(transformUnstakeEntry))
		.map(pendingUnstakes =>
			combine(json.data.unstakes.map(transformUnstakeEntry)).map(
				unstakes => ({
					pendingUnstakes,
					unstakes,
				}),
			),
		)
		.andThen(res => res)
		.mapErr(e => [e])
}

export const handleAccountTransactionsResponse = (
	json: ReturnOfAPICall<'accountTransactionsPost'>,
): Result<AccountTransactionsEndpoint.DecodedResponse, Error[]> =>
	combine(
		json.data.transactions.map(responseHelper.transformTransaction),
	).map(
		(transactions): SimpleTransactionHistory => ({
			cursor: json.data.next_cursor || '',
			transactions,
		}),
	)

export const handleAccountBalancesResponse = (
	json: ReturnOfAPICall<'accountBalancesPost'>,
): Result<AccountBalancesEndpoint.DecodedResponse, Error[]> =>
	combine([
		combine(
			json.data.account_balances.liquid_balances.map(balance =>
				combine([
					Amount.fromUnsafe(balance.value),
					ResourceIdentifier.fromUnsafe(balance.token_identifier.rri),
				]).map(values => ({
					value: values[0] as AmountT,
					token_identifier: {
						rri: values[1] as ResourceIdentifierT,
					},
				})),
			),
		).map(balances => ({ balances })),
		combine([
			ResourceIdentifier.fromUnsafe(
				json.data.account_balances.staked_and_unstaking_balance
					.token_identifier.rri,
			),
			Amount.fromUnsafe(
				json.data.account_balances.staked_and_unstaking_balance.value,
			),
		]),
	])
		.map(values => ({
			ledger_state: {
				...json.data.ledger_state,
				timestamp: new Date(json.data.ledger_state.timestamp),
			},
			account_balances: {
				// @ts-ignore
				liquid_balances: values[0].balances as Decoded.TokenAmount[],
				staked_and_unstaking_balance: {
					token_identifier: {
						rri: values[1] as unknown as ResourceIdentifierT,
					},
					value: values[2] as unknown as AmountT,
				},
			},
		}))
		.mapErr(e => [e])

export const handleValidatorResponse = (
	json: ReturnOfAPICall<'validatorPost'>,
): Result<ValidatorEndpoint.DecodedResponse, Error[]> =>
	responseHelper.transformValidator(json.data.validator).mapErr(e => [e])

export const handleValidatorsResponse = (
	json: ReturnOfAPICall<'validatorsPost'>,
): Result<ValidatorsEndpoint.DecodedResponse, Error[]> =>
	combine(json.data.validators.map(responseHelper.transformValidator))
		.map(validators => ({ validators }))
		.mapErr(e => [e])

export const handleBuildTransactionResponse = (
	json: ReturnOfAPICall<'transactionBuildPost'>,
): Result<BuildTransactionEndpoint.DecodedResponse, Error[]> =>
	Amount.fromUnsafe(json.data.transaction_build.fee.value)
		.map(amount => ({
			transaction: {
				blob: json.data.transaction_build.unsigned_transaction,
				hashOfBlobToSign: json.data.transaction_build.payload_to_sign,
			},
			fee: amount,
		}))
		.mapErr(e => [e])

export const handleFinalizeTransactionResponse = (
	json: ReturnOfAPICall<'transactionFinalizePost'>,
): Result<FinalizeTransactionEndpoint.DecodedResponse, Error[]> =>
	TransactionIdentifier.create(json.data.transaction_identifier.hash)
		.map(txID => ({
			blob: json.data.signed_transaction,
			txID,
		}))
		.mapErr(e => [e] as Error[])

export const handleSubmitTransactionResponse = (
	json: ReturnOfAPICall<'transactionSubmitPost'>,
) =>
	TransactionIdentifier.create(json.data.transaction_identifier.hash)
		.map(txID => ({
			txID,
		}))
		.mapErr(e => [e])

export const handleTransactionResponse = ({
	data: { transaction },
}: ReturnOfAPICall<'transactionStatusPost'>): Result<
	TransactionEndpoint.DecodedResponse,
	Error[]
> => responseHelper.transformTransaction(transaction)
