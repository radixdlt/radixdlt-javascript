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

export const radixCoreAPI = (node: NodeT, api: NodeAPI): RadixCoreAPI => {
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
			toObs(a => a.validators, {
				size: input.size,
				cursor: input.cursor?.toString(),
			}),

		lookupValidator: (input: ValidatorAddressT): Observable<Validator> =>
			toObs(a => a.lookupValidator, {
				validatorAddress: input.toString(),
			}),

		lookupTransaction: (
			txID: TransactionIdentifierT,
		): Observable<SimpleExecutedTransaction> =>
			toObs(a => a.lookupTransaction, {
				txID: txID.toString(),
			}),

		networkId: (): Observable<NetworkT> =>
			toObsMap(
				a => a.networkId,
				m => m.networkId,
				{},
			),

		tokenBalancesForAddress: (
			address: AccountAddressT,
		): Observable<SimpleTokenBalances> =>
			toObs(a => a.tokenBalances, {
				address: address.toString(),
			}),

		transactionHistory: (
			input: TransactionHistoryRequestInput,
		): Observable<SimpleTransactionHistory> =>
			toObs(a => a.transactionHistory, {
				address: input.address.toString(),
				size: input.size,
				cursor: input.cursor?.toString(),
			}),

		nativeToken: (): Observable<Token> => toObs(a => a.nativeToken, {}),
		tokenInfo: (rri: ResourceIdentifierT): Observable<Token> =>
			toObs(a => a.tokenInfo, {
				rri: rri.toString(),
			}),

		stakesForAddress: (
			address: AccountAddressT,
		): Observable<StakePositions> =>
			toObs(a => a.stakePositions, {
				address: address.toString(),
			}),

		unstakesForAddress: (
			address: AccountAddressT,
		): Observable<UnstakePositions> =>
			toObs(a => a.unstakePositions, {
				address: address.toString(),
			}),

		transactionStatus: (
			txID: TransactionIdentifierT,
		): Observable<StatusOfTransaction> =>
			toObs(a => a.statusOfTransaction, {
				txID: txID.toString(),
			}),

		networkTransactionThroughput: (): Observable<NetworkTransactionThroughput> =>
			toObs(a => a.networkTransactionThroughput, {}),

		networkTransactionDemand: (): Observable<NetworkTransactionDemand> =>
			toObs(a => a.networkTransactionDemand, {}),

		buildTransaction: (
			transactionIntent: TransactionIntent,
		): Observable<BuiltTransaction> =>
			toObs(a => a.buildTransaction, {
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
				message: transactionIntent.message
					? transactionIntent.message.toString('hex')
					: undefined,
			}),

		finalizeTransaction: (
			signedTransaction: SignedTransaction,
		): Observable<FinalizedTransaction> =>
			toObs(a => a.finalizeTransaction, {
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
			toObs(a => a.submitTransaction, {
				transaction: {
					blob: finalizedTx.transaction.blob,
				},
				signatureDER: finalizedTx.signature.toDER(),
				publicKeyOfSigner: finalizedTx.publicKeyOfSigner.toString(true),
				txID: finalizedTx.txID.toString(),
			}),
	}
}
