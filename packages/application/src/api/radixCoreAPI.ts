import { NodeAPI, NodeT, RadixCoreAPI } from './_types'
import { ResultAsync } from 'neverthrow'
import { defer, Observable } from 'rxjs'
import {
	AccountAddressT,
	ResourceIdentifierT,
	ValidatorAddressT,
} from '@radixdlt/account'
import { map } from 'rxjs/operators'
import {
	SimpleExecutedTransaction,
	NetworkTransactionDemand,
	NetworkTransactionThroughput,
	PendingTransaction,
	FinalizedTransaction,
	SignedTransaction,
	StakePositions,
	StatusOfTransaction,
	Token,
	SimpleTransactionHistory,
	TransactionHistoryRequestInput,
	TransactionIdentifierT,
	TransactionIntent,
	BuiltTransaction,
	UnstakePositions,
	Validators,
	ValidatorsRequestInput,
	SimpleTokenBalances,
	Validator,
} from '../dto'
import { ActionType } from '../actions'
import { toObservable } from '@radixdlt/util'
import { NetworkT } from '@radixdlt/primitives'

export const radixCoreAPI = (node: NodeT, api: NodeAPI) => {
	const toObs = <I, E, O>(
		pickFn: (api: NodeAPI) => (input: I) => ResultAsync<O, E | E[]>,
		input: I,
	): Observable<O> =>
		defer(() => {
			const fn = pickFn(api)
			return toObservable(fn(input))
		})

	const toObsMap = <I extends Record<string, unknown>, E, O, P>(
		pickFn: (api: NodeAPI) => (input: I) => ResultAsync<O, E | E[]>,
		mapOutput: (output: O) => P,
		input: I,
	): Observable<P> => toObs(pickFn, input).pipe(map(o => mapOutput(o)))

	return {
		node,

		validators: (input: ValidatorsRequestInput): Observable<Validators> =>
			toObs(a => a['validators.get_next_epoch_set'], {
				size: input.size,
				cursor: input.cursor?.toString(),
			}),

		lookupValidator: (input: ValidatorAddressT): Observable<Validator> =>
			toObs(a => a['validators.lookup_validator'], {
				validatorAddress: input.toString(),
			}),

		lookupTransaction: (
			txID: TransactionIdentifierT,
		): Observable<SimpleExecutedTransaction> =>
			toObs(a => a['transactions.lookup_transaction'], {
				txID: txID.toString(),
			}),

		networkId: (): Observable<NetworkT> =>
			toObsMap(
				a => a['network.get_id'],
				m => m.networkId,
				{},
			),

		tokenBalancesForAddress: (
			address: AccountAddressT,
		): Observable<SimpleTokenBalances> =>
			toObs(a => a['account.get_balances'], {
				address: address.toString(),
			}),

		transactionHistory: (
			input: TransactionHistoryRequestInput,
		): Observable<SimpleTransactionHistory> =>
			toObs(a => a['account.get_transaction_history'], {
				address: input.address.toString(),
				size: input.size,
				cursor: input.cursor?.toString(),
			}),

		nativeToken: (): Observable<Token> =>
			toObs(a => a['tokens.get_native_token'], {}),
		tokenInfo: (rri: ResourceIdentifierT): Observable<Token> =>
			toObs(a => a['tokens.get_info'], {
				rri: rri.toString(),
			}),

		stakesForAddress: (
			address: AccountAddressT,
		): Observable<StakePositions> =>
			toObs(a => a['account.get_stake_positions'], {
				address: address.toString(),
			}),

		unstakesForAddress: (
			address: AccountAddressT,
		): Observable<UnstakePositions> =>
			toObs(a => a['account.get_unstake_positions'], {
				address: address.toString(),
			}),

		transactionStatus: (
			txID: TransactionIdentifierT,
		): Observable<StatusOfTransaction> =>
			toObs(a => a['transactions.get_transaction_status'], {
				txID: txID.toString(),
			}),

		networkTransactionThroughput: (): Observable<NetworkTransactionThroughput> =>
			toObs(a => a['network.get_throughput'], {}),

		networkTransactionDemand: (): Observable<NetworkTransactionDemand> =>
			toObs(a => a['network.get_demand'], {}),

		buildTransaction: (
			transactionIntent: TransactionIntent,
			from: AccountAddressT,
		): Observable<BuiltTransaction> =>
			toObs(a => a['construction.build_transaction'], {
				actions: transactionIntent.actions.map(action =>
					action.type === ActionType.TOKEN_TRANSFER
						? {
								type: action.type,
								from: action.from.toString(),
								to: action.to.toString(),
								amount: action.amount.toString(),
								rri: action.rri.toString(),
						  }
						: {
								type: action.type,
								from: action.from.toString(),
								validator: action.validator.toString(),
								amount: action.amount.toString(),
						  },
				),
				feePayer: from.toString(),
				message: transactionIntent.message
					? transactionIntent.message.toString('hex')
					: undefined,
			}),

		finalizeTransaction: (
			signedTransaction: SignedTransaction,
		): Observable<FinalizedTransaction> =>
			toObs(a => a['construction.finalize_transaction'], {
				transaction: {
					blob: signedTransaction.transaction.blob,
				},
				signatureDER: signedTransaction.signature.toDER(),
				publicKeyOfSigner: signedTransaction.publicKeyOfSigner.toString(
					true,
				),
			}),

		submitSignedTransaction: (
			finalizedTx: FinalizedTransaction & SignedTransaction,
		): Observable<PendingTransaction> =>
			toObs(a => a['construction.submit_transaction'], {
				transaction: {
					blob: finalizedTx.transaction.blob,
				},
				signatureDER: finalizedTx.signature.toDER(),
				publicKeyOfSigner: finalizedTx.publicKeyOfSigner.toString(true),
				txID: finalizedTx.txID.toString(),
			}),
	}
}
