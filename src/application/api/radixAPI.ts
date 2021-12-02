import { NodeAPI } from './_types'
import {
	AccountAddressT,
	ResourceIdentifierT,
	ValidatorAddressT,
} from '@account'
import {
	FinalizedTransaction,
	SignedTransaction,
	TransactionHistoryRequestInput,
	TransactionIdentifierT,
	TransactionIntent,
} from '../dto'
import { pipe } from 'ramda'
import {
	GatewayEndpoint,
	ValidatorsEndpoint,
	ValidatorEndpoint,
	AccountBalancesEndpoint,
	AccountTransactionsEndpoint,
	NativeTokenInfoEndpoint,
	TokenInfoEndpoint,
	StakePositionsEndpoint,
	UnstakePositionsEndpoint,
	TransactionEndpoint,
	FinalizeTransactionEndpoint,
	SubmitTransactionEndpoint,
} from '../api/open-api/_types'
import { ResultAsync } from 'neverthrow'
import { actionToPrimitive } from '../actions/actionToPrimitive'

export const radixAPI = (nodeAPI: NodeAPI) => ({
	validators: (
		network: string,
	): ResultAsync<ValidatorsEndpoint.DecodedResponse, Error[]> =>
		nodeAPI['validators']({ network }),

	lookupValidator: (
		input: ValidatorAddressT,
	): ResultAsync<ValidatorEndpoint.DecodedResponse, Error[]> =>
		nodeAPI['validator']({
			network: input.network,
			validator_identifier: { address: input.toPrimitive() },
		}),

	networkId: (): ResultAsync<GatewayEndpoint.DecodedResponse, Error[]> =>
		nodeAPI['gateway']({}),

	tokenBalancesForAddress: (
		address: AccountAddressT,
	): ResultAsync<AccountBalancesEndpoint.DecodedResponse, Error[]> =>
		nodeAPI['accountBalances']({
			network: address.network,
			account_identifier: {
				address: address.toPrimitive(),
			},
		}),

	transactionHistory: ({
		address,
		size: limit,
		cursor,
	}: TransactionHistoryRequestInput): ResultAsync<
		AccountTransactionsEndpoint.DecodedResponse,
		Error[]
	> =>
		nodeAPI['accountTransactions']({
			account_identifier: {
				address: address.toPrimitive(),
			},
			network: address.network,
			limit,
			cursor,
		}),

	nativeToken: (
		input: NativeTokenInfoEndpoint.Input,
	): ResultAsync<NativeTokenInfoEndpoint.DecodedResponse, Error[]> =>
		nodeAPI['nativeTokenInfo'](input),

	tokenInfo: (
		rri: ResourceIdentifierT,
	): ResultAsync<TokenInfoEndpoint.DecodedResponse, Error[]> =>
		nodeAPI['tokenInfo']({
			network: rri.network,
			token_identifier: {
				rri: rri.toPrimitive(),
			},
		}),

	stakesForAddress: (
		address: AccountAddressT,
	): ResultAsync<StakePositionsEndpoint.DecodedResponse, Error[]> =>
		nodeAPI['stakePositions']({
			network: address.network,
			account_identifier: {
				address: address.toPrimitive(),
			},
		}),

	unstakesForAddress: (
		address: AccountAddressT,
	): ResultAsync<UnstakePositionsEndpoint.DecodedResponse, Error[]> =>
		nodeAPI['unstakePositions']({
			network: address.network,
			account_identifier: {
				address: address.toPrimitive(),
			},
		}),

	transactionStatus: (
		txID: TransactionIdentifierT,
		network: string,
	): ResultAsync<TransactionEndpoint.DecodedResponse, Error[]> =>
		nodeAPI['getTransaction']({
			network,
			transaction_identifier: {
				hash: txID.toPrimitive(),
			},
		}),

	buildTransaction: (from: AccountAddressT) =>
		pipe(
			(transactionIntent: TransactionIntent) => ({
				network: from.network,
				actions: transactionIntent.actions.map(actionToPrimitive),
				fee_payer: {
					address: from.toPrimitive(),
				},
				message: transactionIntent.message
					? transactionIntent.message.toString('hex')
					: undefined,
				disable_token_mint_and_burn: true,
			}),
			nodeAPI['buildTransaction'],
		),

	finalizeTransaction: (
		network: string,
		signedTransaction: SignedTransaction,
	): ResultAsync<FinalizeTransactionEndpoint.DecodedResponse, Error[]> =>
		nodeAPI['finalizeTransaction']({
			network,
			unsigned_transaction: signedTransaction.transaction.blob,
			signature: {
				bytes: signedTransaction.signature.toDER(),
				public_key: signedTransaction.publicKeyOfSigner.toString(),
			},
		}),

	submitSignedTransaction: (
		network: string,
		finalizedTx: FinalizedTransaction,
	): ResultAsync<SubmitTransactionEndpoint.DecodedResponse, Error[]> =>
		nodeAPI['submitTransaction']({
			network,
			signed_transaction: finalizedTx.blob,
		}),
})
