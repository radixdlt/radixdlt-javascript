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
	Decoded,
} from './_types'
import { Action, ReturnOfAPICall, TransferTokens } from '@radixdlt/networking'
import { err, Result } from 'neverthrow'
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
import { Token, TransactionIdentifier, TransactionIdentifierT } from '../..'
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
): Result<TokenInfoEndpoint.DecodedResponse, Error[]> =>
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
): Result<NativeTokenInfoEndpoint.DecodedResponse, Error[]> => {
	return combine([
		ResourceIdentifier.fromUnsafe(json.token.tokenIdentifier.rri),
		Amount.fromUnsafe(json.token.tokenProperties.granularity),
		Amount.fromUnsafe(json.token.tokenSupply.value),
	])
		.map(values => ({
			name: json.token.tokenProperties.name ?? '',
			rri: values[0] as ResourceIdentifierT,
			symbol: json.token.tokenProperties.symbol,
			description: json.token.tokenProperties.description,
			granularity: values[1] as AmountT,
			isSupplyMutable: json.token.tokenProperties.isSupplyMutable,
			currentSupply: values[2] as AmountT,
			tokenInfoURL: json.token.tokenProperties.url
				? new URL(json.token.tokenProperties.url)
				: undefined,
			iconURL: json.token.tokenProperties.iconUrl
				? new URL(json.token.tokenProperties.iconUrl)
				: undefined,
		}))
		.mapErr(e => [e])
}

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

export const handleUnstakePositionsResponse = (
	json: ReturnOfAPICall<'accountUnstakesPost'>,
) =>
	combine(
		json.unstakes.map(unstake =>
			combine([
				ValidatorAddress.fromUnsafe(
					unstake.validatorIdentifier.address,
				),
				Amount.fromUnsafe(unstake.unstakingAmount.value),
				ok<number, Error>(unstake.epochsUntilUnlocked),
			]).map(value => ({
				validator: value[0] as ValidatorAddressT,
				amount: value[1] as AmountT,
				epochsUntil: value[2] as number,
			})),
		),
	).mapErr(e => [e])

export const handleAccountTransactionsResponse = (
	json: ReturnOfAPICall<'accountTransactionsPost'>,
) =>
	combine(
		json.transactions.map(transaction =>
			combine([
				TransactionIdentifier.create(
					transaction.transactionIdentifier.hash,
				),
				ok<Date | null, Error>(
					transaction.transactionStatus.confirmedTime
						? new Date(transaction.transactionStatus.confirmedTime)
						: null,
				),
				Amount.fromUnsafe(transaction.feePaid.value),
				ok<string | null, Error>(transaction.metadata.message ?? null),
				...transaction.actions.map(action =>
					combine([]).map(actionValue => ({})),
				),
			]).map(value => ({
				txID: value[0] as TransactionIdentifierT,
				sentAt: value[1] as Date,
				fee: value[2] as AmountT,
				message: value[3] as string,
			})),
		),
	)
		.map(transactions => ({ cursor: json.nextCursor, transactions }))
		.mapErr(e => [e])

// export const handleAccountTransactionsResponse = (
// 	json: ReturnOfAPICall<'accountTransactionsPost'>,
// ) =>
// 	JSONDecoding.withDecoders(
// 		transactionIdentifierDecoder('hash'),
// 		dateDecoder('timestamp'),
// 		...tokenDecoders,
// 	)
// 		.create<
// 			AccountTransactionsEndpoint.Response,
// 			AccountTransactionsEndpoint.DecodedResponse
// 		>()(json)
// 		.andThen(decoded =>
// 			hasRequiredProps('accountTransactions', decoded, [
// 				'ledger_state',
// 				'total_count',
// 				'transactions',
// 			]),
// 		)

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
*/

export const handleAccountBalancesResponse = (
	json: ReturnOfAPICall<'accountBalancesPost'>,
): Result<AccountBalancesEndpoint.DecodedResponse, Error[]> => {
	const liquidBalancesResults = combine(json.accountBalances.liquidBalances.map(balance => combine([
		Amount.fromUnsafe(balance.value),
		ResourceIdentifier.fromUnsafe(balance.tokenIdentifier.rri)
	]).map(values => ({
		value: values[0] as AmountT,
		token_identifier: {
			rri: values[1] as ResourceIdentifierT
		}
	}))))

	const stakingAndUnstakingBalancesResult = combine([
		ResourceIdentifier.fromUnsafe(json.accountBalances.stakedAndUnstakingBalance.tokenIdentifier.rri),
		Amount.fromUnsafe(json.accountBalances.stakedAndUnstakingBalance.value)
	])

	return combine([
		liquidBalancesResults.map(balances => ({ balances })),
		stakingAndUnstakingBalancesResult
	]).map(values => ({
		ledger_state: {
			...json.ledgerState,
			timestamp: new Date(json.ledgerState.timestamp)
		},
		account_balances: {
			// @ts-ignore
			liquid_balances: values[0].balances as Decoded.TokenAmount[],
			staked_and_unstaking_balance: {
				token_identifier: {
					rri: values[1] as unknown as ResourceIdentifierT,
				},
				value: values[2] as unknown as AmountT
			}
		}
	})).mapErr(e => [e])
}


/*

export const handleStakePositionsResponse = (
	json: ReturnOfAPICall<'accountStakesPost'>,
) => combine([

]).mapErr(e => [e])

json.stakes.map(stake => combine([
	ValidatorAddress.fromUnsafe(stake.validatorIdentifier.address),
	Amount.fromUnsafe(stake.delegatedStake.value)
]).map(values => ({
	validator: values[0] as ValidatorAddressT,
	amount: values[1] as AmountT
})

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
*/
	export const handleBuildTransactionResponse = (
		json: ReturnOfAPICall<'transactionBuildPost'>,
	): Result<BuildTransactionEndpoint.DecodedResponse, Error[]> => Amount.fromUnsafe(json.transactionBuild.fee.value).map(amount => ({
		transaction: {
			blob: json.transactionBuild.unsignedTransaction,
			hashOfBlobToSign: json.transactionBuild.payloadToSign
		},
		fee: amount
	})).mapErr(e => [e])
	

	export const handleFinalizeTransactionResponse = (
		json: ReturnOfAPICall<'transactionFinalizePost'>,
	): Result<FinalizeTransactionEndpoint.DecodedResponse, Error[]> => ok({
		blob: json.signedTransaction
	}).mapErr(e => [e] as Error[])

	export const handleSubmitTransactionResponse = (
		json: ReturnOfAPICall<'transactionSubmitPost'>,
	) => TransactionIdentifier.create(json.transactionIdentifier.hash).map(txID => ({
		txID
	})).mapErr(e => [e])

		
	export const handleTransactionResponse = (
		json: ReturnOfAPICall<'transactionStatusPost'>,
	): Result<TransactionEndpoint.DecodedResponse, Error[]> => json.transaction.length === 0
		? err([Error('Transaction not found.')])
		: combine([
			TransactionIdentifier.create(json.transaction[0].transactionIdentifier.hash),
			Amount.fromUnsafe(json.transaction[0].feePaid.value)
		]).map(values => ({
			txID: values[0] as TransactionIdentifierT,
			status: json.transaction[0].transactionStatus.status,
			fee: values[1] as AmountT
		})).mapErr(e => [e])