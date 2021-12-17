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
import {
	AccountStakeEntry,
	Action,
	ReturnOfAPICall,
	StakeTokens,
	TokenAmount,
	TransferTokens,
	UnstakeTokens,
	Validator as ValidatorRaw,
} from '@radixdlt/networking'
import { Result } from 'neverthrow'
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
	ExecutedStakeTokensAction,
	ExecutedTransferTokensAction,
	ExecutedUnstakeTokensAction,
	SimpleTransactionHistory,
	TransactionIdentifier,
	TransactionIdentifierT,
	TransactionStatus as TransactionStatusEnum,
} from '../..'
import { ok, combine } from 'neverthrow'
import { Message } from '@radixdlt/crypto'

const transformTokenAmount = (amount: TokenAmount) => [
	Amount.fromUnsafe(amount.value),
	ResourceIdentifier.fromUnsafe(amount.token_identifier.rri),
]

export const transformMessage = (message?: string) => {
	if (!message) return undefined

	// Check format
	if (!/^(00|01|30)[0-9a-fA-F]+$/.test(message))
		return '<Failed to interpret message>'

	if (Message.isHexEncoded(message)) {
		const decoded = Message.plaintextToString(
			Buffer.from(message, 'hex'),
			0,
		)

		return Message.isPlaintext(decoded)
			? Message.plaintextToString(Buffer.from(decoded, 'hex'))
			: message
	}

	return Message.isPlaintext(message)
		? Message.plaintextToString(Buffer.from(message, 'hex'))
		: message
}

export const handleGatewayResponse = (
	json: ReturnOfAPICall<'gatewayPost'>,
): Result<GatewayEndpoint.DecodedResponse, Error[]> =>
	ok({
		// @ts-ignore
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

const transformStakeEntry = (stake: AccountStakeEntry) =>
	combine([
		ValidatorAddress.fromUnsafe(stake.validator_identifier.address),
		Amount.fromUnsafe(stake.delegated_stake.value),
	]).map(value => ({
		validator: value[0] as ValidatorAddressT,
		amount: value[1] as AmountT,
	}))

export const handleStakePositionsResponse = (
	json: ReturnOfAPICall<'accountStakesPost'>,
): Result<StakePositionsEndpoint.DecodedResponse, Error[]> =>
	combine(json.data.stakes.map(transformStakeEntry))
		.andThen(stakes =>
			combine(
				json.data.pending_stakes.map(transformStakeEntry),
			).map(pendingStakes => ({ stakes, pendingStakes })),
		)
		.mapErr(e => [e])

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
): Result<AccountTransactionsEndpoint.DecodedResponse, Error[]> =>
	combine(json.data.transactions.map(handleTx)).map(
		(transactions): SimpleTransactionHistory => ({
			cursor: json.data.next_cursor as string,
			// @ts-ignore
			transactions,
		}),
	)

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
	]).map(
		(values): ValidatorEndpoint.DecodedResponse => ({
			address: values[0] as ValidatorAddressT,
			ownerAddress: values[1] as AccountAddressT,
			name: validator.properties.name,
			infoURL: transformUrl(validator.properties.url),
			totalDelegatedStake: values[2] as AmountT,
			ownerDelegation: values[3] as AmountT,
			validatorFee: validator.properties.validator_fee_percentage,
			registered: validator.properties.registered,
			isExternalStakeAccepted:
				validator.properties.external_stake_accepted,
			uptimePercentage: validator.info.uptime.uptime_percentage,
			proposalsMissed: validator.info.uptime.proposals_missed,
			proposalsCompleted: validator.info.uptime.proposals_completed,
		}),
	)

export const handleAccountBalancesResponse = (
	json: ReturnOfAPICall<'accountBalancesPost'>,
): Result<AccountBalancesEndpoint.DecodedResponse, Error[]> => {
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
						rri: (values[1] as unknown) as ResourceIdentifierT,
					},
					value: (values[2] as unknown) as AmountT,
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

export const handleTransactionResponse = (
	json: ReturnOfAPICall<'transactionStatusPost'>,
): Result<TransactionEndpoint.DecodedResponse, Error[]> =>
	handleTx(json.data.transaction)

const handleTx = (
	transaction: ReturnOfAPICall<'transactionStatusPost'>['data']['transaction'],
) => {
	const transformAction = (action: Action): Result<ExecutedAction, Error> => {
		const transformTransferTokenAction = (action: TransferTokens) =>
			combine([
				AccountAddress.fromUnsafe(action.to_account.address),
				AccountAddress.fromUnsafe(action.from_account.address),
				...(action.amount ? transformTokenAmount(action.amount) : []),
			]).map(
				(actionValue): ExecutedTransferTokensAction => ({
					type: ActionType.TOKEN_TRANSFER,
					to_account: actionValue[0] as AccountAddressT,
					from_account: actionValue[1] as AccountAddressT,
					amount: actionValue[2] as AmountT,
					rri: actionValue[3] as ResourceIdentifierT,
				}),
			)

		const transformStakeTokenAction = (
			type: ActionType.STAKE_TOKENS,
			action: StakeTokens,
		) =>
			combine([
				...transformTokenAmount(action.amount),
				ValidatorAddress.fromUnsafe(action.to_validator.address),
				AccountAddress.fromUnsafe(action.from_account.address),
			]).map((actionValue):
				| ExecutedStakeTokensAction
				| ExecutedUnstakeTokensAction => ({
				type,
				amount: actionValue[0] as AmountT,
				rri: actionValue[1] as ResourceIdentifierT,
				to_validator: actionValue[2] as ValidatorAddressT,
				from_account: actionValue[3] as AccountAddressT,
			}))

		const transformUnstakeTokenAction = (
			type: ActionType.UNSTAKE_TOKENS,
			action: UnstakeTokens,
		) =>
			combine([
				ValidatorAddress.fromUnsafe(action.from_validator.address),
				AccountAddress.fromUnsafe(action.to_account.address),
				...(action.amount ? transformTokenAmount(action.amount) : []),
			]).map((actionValue):
				| ExecutedStakeTokensAction
				| ExecutedUnstakeTokensAction => ({
				type,
				from_validator: actionValue[0] as ValidatorAddressT,
				to_account: actionValue[1] as AccountAddressT,
				amount: actionValue[2] as AmountT,
				rri: actionValue[3] as ResourceIdentifierT,
			}))

		switch (action.type) {
			case 'TransferTokens':
				return transformTransferTokenAction(action as TransferTokens)
			case 'StakeTokens':
				return transformStakeTokenAction(
					ActionType.STAKE_TOKENS,
					action as StakeTokens,
				)
			case 'UnstakeTokens':
				return transformUnstakeTokenAction(
					ActionType.UNSTAKE_TOKENS,
					action as UnstakeTokens,
				)
			default:
				return ok({ ...action, type: ActionType.OTHER })
		}
	}

	transaction.transaction_identifier.hash

	return combine([
		TransactionIdentifier.create(transaction.transaction_identifier.hash),
		ok(
			transaction.transaction_status.confirmed_time
				? new Date(transaction.transaction_status.confirmed_time)
				: null,
		),
		Amount.fromUnsafe(transaction.fee_paid.value),
		ok(transformMessage(transaction.metadata.message) ?? ''),
		combine(transaction.actions.map(transformAction)).map(actions => ({
			actions,
		})),
		ok(transaction.transaction_status.status),
	])
		.map(value => ({
			txID: value[0] as TransactionIdentifierT,
			sentAt: value[1] as Date,
			fee: value[2] as AmountT,
			message: value[3] as string,
			// @ts-ignore
			actions: value[4].actions as ExecutedAction[],
			status: value[5] as TransactionStatusEnum,
		}))
		.mapErr(e => [e] as Error[])
}
