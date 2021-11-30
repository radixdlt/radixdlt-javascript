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
} from './_types'
import {
	Action,
	ReturnOfAPICall,
	StakeTokens,
	TokenAmount,
	TransferTokens,
	Validator as ValidatorRaw,
} from '@radixdlt/networking'
import { err, Result } from 'neverthrow'
import {
	ResourceIdentifier,
	ResourceIdentifierT,
	ValidatorAddress,
	ValidatorAddressT,
	AccountAddress,
	AccountAddressT,
} from '@radixdlt/account'
import { Amount, AmountT, Network } from '@radixdlt/primitives'
import {
	ActionType,
	ExecutedAction,
	ExecutedTransferTokensAction,
	SimpleTransactionHistory,
	StakeAndUnstakeTokensProps,
	TransactionIdentifier,
	TransactionIdentifierT,
	Validator,
} from '../..'
import { ok, combine } from 'neverthrow'
import { Message } from '@radixdlt/crypto'

const transformTokenAmount = (amount: TokenAmount) => [
	Amount.fromUnsafe(amount.value),
	ResourceIdentifier.fromUnsafe(amount.token_identifier.rri),
]

const transformMessage = (message?: string) => {
	if (!message) return undefined

	// Check format
	if (!/^(00|01)[0-9a-fA-F]+$/.test(message))
		return '<Failed to interpret message>'

	return Message.isPlaintext(message)
		? Message.plaintextToString(Buffer.from(message, 'hex'))
		: message
}

export const handleNetworkResponse = (json: ReturnOfAPICall<'networkPost'>) =>
	ok({
		network: json.data.network as Network,
	}).mapErr(e => [e] as Error[])

export const handleTokenInfoResponse = (
	json: ReturnOfAPICall<'tokenPost'>,
): Result<TokenInfoEndpoint.DecodedResponse, Error[]> =>
	combine([
		ResourceIdentifier.fromUnsafe(json.data.token[0].token_identifier.rri),
		Amount.fromUnsafe(json.data.token[0].token_properties.granularity),
		Amount.fromUnsafe(json.data.token[0].token_supply.value),
	])
		.map(values => ({
			name: json.data.token[0].token_properties.name ?? '',
			rri: values[0] as ResourceIdentifierT,
			symbol: json.data.token[0].token_properties.symbol,
			description: json.data.token[0].token_properties.description,
			granularity: values[1] as AmountT,
			isSupplyMutable:
				json.data.token[0].token_properties.is_supply_mutable,
			currentSupply: values[2] as AmountT,
			tokenInfoURL: json.data.token[0].token_properties.url
				? new URL(json.data.token[0].token_properties.url)
				: undefined,
			iconURL: json.data.token[0].token_properties.icon_url
				? new URL(json.data.token[0].token_properties.icon_url)
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
	combine(
		json.data.stakes.map(stake =>
			combine([
				ValidatorAddress.fromUnsafe(stake.validator_identifier.address),
				Amount.fromUnsafe(stake.delegated_stake.value),
			]).map(value => ({
				validator: value[0] as ValidatorAddressT,
				amount: value[1] as AmountT,
			})),
		),
	).mapErr(e => [e])

export const handleUnstakePositionsResponse = (
	json: ReturnOfAPICall<'accountUnstakesPost'>,
): Result<UnstakePositionsEndpoint.DecodedResponse, Error[]> =>
	combine(
		json.data.unstakes.map(unstake =>
			combine([
				ValidatorAddress.fromUnsafe(
					unstake.validator_identifier.address,
				),
				Amount.fromUnsafe(unstake.unstaking_amount.value),
				ok<number, Error>(unstake.epochs_until_unlocked),
			]).map(value => ({
				validator: value[0] as ValidatorAddressT,
				amount: value[1] as AmountT,
				epochsUntil: value[2] as number,
			})),
		),
	).mapErr(e => [e])

export const handleAccountTransactionsResponse = (
	json: ReturnOfAPICall<'accountTransactionsPost'>,
): Result<AccountTransactionsEndpoint.DecodedResponse, Error[]> => {
	const transformAction = (action: Action) => {
		const transformTransferTokenAction = (action: Action) => {
			const transferTokenAction = action as TransferTokens

			return combine([
				...transformTokenAmount(transferTokenAction.amount),
				AccountAddress.fromUnsafe(transferTokenAction.to.address),
				AccountAddress.fromUnsafe(transferTokenAction.from.address),
			]).map(
				(actionValue): ExecutedTransferTokensAction => ({
					type: ActionType.TOKEN_TRANSFER,
					amount: actionValue[0] as AmountT,
					rri: actionValue[1] as ResourceIdentifierT,
					to: actionValue[2] as AccountAddressT,
					from: actionValue[3] as AccountAddressT,
				}),
			)
		}

		const transformStakeAndUnstakeTokenAction = (
			type: ActionType,
			action: Action,
		) => {
			const stakeAction = action as StakeTokens

			return combine([
				...transformTokenAmount(stakeAction.amount),
				ValidatorAddress.fromUnsafe(stakeAction.to.address),
				AccountAddress.fromUnsafe(stakeAction.from.address),
			]).map(
				(
					actionValue,
				): StakeAndUnstakeTokensProps & { type: ActionType } => ({
					type,
					amount: actionValue[0] as AmountT,
					rri: actionValue[1] as ResourceIdentifierT,
					validator: actionValue[2] as ValidatorAddressT,
					from: actionValue[3] as AccountAddressT,
				}),
			)
		}

		switch (action.type) {
			case 'TransferTokens':
				return transformTransferTokenAction(action)
			case 'StakeTokens':
				return transformStakeAndUnstakeTokenAction(
					ActionType.STAKE_TOKENS,
					action,
				)
			case 'UnstakeTokens':
				return transformStakeAndUnstakeTokenAction(
					ActionType.UNSTAKE_TOKENS,
					action,
				)

			default:
				return ok({ ...action, type: ActionType.OTHER })
		}
	}

	return combine(
		json.data.transactions.map(transaction => {
			const actions = transaction.actions.map(transformAction)
			return combine([
				TransactionIdentifier.create(
					transaction.transaction_identifier.hash,
				),
				ok<Date | null, Error>(
					transaction.transaction_status.confirmed_time
						? new Date(
								transaction.transaction_status.confirmed_time,
						  )
						: null,
				),
				Amount.fromUnsafe(transaction.fee_paid.value),
				ok<string, Error>(
					transformMessage(transaction.metadata.message) ?? '',
				),
			]).andThen(value =>
				// @ts-ignore
				combine(actions).map(actions => ({
					txID: value[0] as TransactionIdentifierT,
					sentAt: value[1] as Date,
					fee: value[2] as AmountT,
					message: value[3] as string,
					actions,
				})),
			)
		}),
	)
		.map(
			(transactions): SimpleTransactionHistory => ({
				cursor: json.data.next_cursor as string,
				// @ts-ignore
				transactions,
			}),
		)
		.mapErr(e => [e])
}

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
export const handleDerivetoken_identifierResponse = (
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

const transformUrl = (url: string) => {
	try {
		return new URL(url)
	} catch (error) {
		return undefined
	}
}

const transformValidator = (validator: ValidatorRaw) =>
	combine([
		ValidatorAddress.fromUnsafe(validator.validator_identifier.address),
		AccountAddress.fromUnsafe(
			validator.properties.owner_account_identifier.address,
		),
		Amount.fromUnsafe(validator.stake.value),
		Amount.fromUnsafe(validator.info.owner_stake.value),
	]).map((values): Omit<Validator, 'infoURL'> & { infoURL?: URL } => ({
		address: values[0] as ValidatorAddressT,
		ownerAddress: values[1] as AccountAddressT,
		name: validator.properties.name,
		infoURL: transformUrl(validator.properties.url),
		totalDelegatedStake: values[2] as AmountT,
		ownerDelegation: values[3] as AmountT,
		validatorFee: validator.properties.validator_fee,
		registered: validator.properties.registered,
		isExternalStakeAccepted: validator.properties.external_stake_accepted,
		uptimePercentage: validator.info.uptime.uptime_percentage,
		proposalsMissed: validator.info.uptime.proposals_missed,
		proposalsCompleted: validator.info.uptime.proposals_completed,
	}))

export const handleAccountBalancesResponse = (
	json: ReturnOfAPICall<'accountBalancesPost'>,
): Result<AccountBalancesEndpoint.DecodedResponse, Error[]> => {
	const a = json.data.account_balances

	const liquidBalancesResults = combine(
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
	)

	const stakingAndUnstakingBalancesResult = combine([
		ResourceIdentifier.fromUnsafe(
			json.data.account_balances.staked_and_unstaking_balance
				.token_identifier.rri,
		),
		Amount.fromUnsafe(
			json.data.account_balances.staked_and_unstaking_balance.value,
		),
	])

	return combine([
		liquidBalancesResults.map(balances => ({ balances })),
		stakingAndUnstakingBalancesResult,
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
}

export const handleValidatorResponse = (
	json: ReturnOfAPICall<'validatorPost'>,
): Result<ValidatorEndpoint.DecodedResponse, Error[]> =>
	transformValidator(json.data.validator).mapErr(e => [e])

export const handleValidatorsResponse = (
	json: ReturnOfAPICall<'validatorsPost'>,
): Result<ValidatorsEndpoint.DecodedResponse, Error[]> =>
	combine(json.data.validators.map(transformValidator))
		.map(validators => ({ validators }))
		.mapErr(e => [e])

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
	ok({
		blob: json.data.signed_transaction,
	}).mapErr(e => [e] as Error[])

export const handleSubmitTransactionResponse = (
	json: ReturnOfAPICall<'transactionSubmitPost'>,
) =>
	TransactionIdentifier.create(json.data.transaction_identifier.hash)
		.map(txID => ({
			txID,
		}))
		.mapErr(e => [e])

export const handleTransactionResponse = (
	json: ReturnOfAPICall<'transactionStatusPost'>,
): Result<TransactionEndpoint.DecodedResponse, Error[]> =>
	json.data.transaction.length === 0
		? err([Error('Transaction not found.')])
		: combine([
				TransactionIdentifier.create(
					json.data.transaction[0].transaction_identifier.hash,
				),
				Amount.fromUnsafe(json.data.transaction[0].fee_paid.value),
		  ])
				.map(values => ({
					txID: values[0] as TransactionIdentifierT,
					status: json.data.transaction[0].transaction_status.status,
					fee: values[1] as AmountT,
				}))
				.mapErr(e => [e])
