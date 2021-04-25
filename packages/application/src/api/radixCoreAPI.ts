import { NodeAPI, NodeT, RadixCoreAPI } from './_types'
import { ResultAsync } from 'neverthrow'
import { defer, Observable } from 'rxjs'
import {
	AccountAddressT,
	ResourceIdentifierT,
	toObservable,
	ValidatorAddressT,
	NetworkT,
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
} from '../dto/_types'
import { ActionType } from '../actions'

export const radixCoreAPI = (node: NodeT, api: NodeAPI): RadixCoreAPI => {
	const toObs = <I extends unknown[], E, O>(
		pickFn: (api: NodeAPI) => (...input: I) => ResultAsync<O, E | E[]>,
		...input: I
	): Observable<O> => {
		return defer(() => {
			const fn: (...input: I) => ResultAsync<O, E | E[]> = pickFn(api)
			return toObservable(fn(...input))
		})
	}

	const toObsMap = <I extends unknown[], E, O, P>(
		pickFn: (api: NodeAPI) => (...input: I) => ResultAsync<O, E | E[]>,
		mapOutput: (output: O) => P,
		...input: I
	): Observable<P> => toObs(pickFn, ...input).pipe(map((o) => mapOutput(o)))

	return {
		node,

		validators: (input: ValidatorsRequestInput): Observable<Validators> =>
			toObs((a) => a.validators, input.size, input.cursor?.toString()),

		lookupValidator: (input: ValidatorAddressT): Observable<Validator> =>
			toObs((a) => a.lookupValidator, input.toString()),

		lookupTransaction: (
			txID: TransactionIdentifierT,
		): Observable<SimpleExecutedTransaction> =>
			toObs((a) => a.lookupTransaction, txID.toString()),

		networkId: (): Observable<NetworkT> =>
			toObsMap(
				(a) => a.networkId,
				(m) => m.networkId,
			),

		tokenBalancesForAddress: (
			address: AccountAddressT,
		): Observable<SimpleTokenBalances> =>
			toObs((a) => a.tokenBalances, address.toString()),

		transactionHistory: (
			input: TransactionHistoryRequestInput,
		): Observable<SimpleTransactionHistory> =>
			toObs(
				(a) => a.transactionHistory,
				input.address.toString(),
				input.size,
				input.cursor?.toString(),
			),

		nativeToken: (): Observable<Token> => toObs((a) => a.nativeToken),
		tokenInfo: (rri: ResourceIdentifierT): Observable<Token> =>
			toObs((a) => a.tokenInfo, rri.toString()),

		stakesForAddress: (
			address: AccountAddressT,
		): Observable<StakePositions> =>
			toObs((a) => a.stakePositions, address.toString()),

		unstakesForAddress: (
			address: AccountAddressT,
		): Observable<UnstakePositions> =>
			toObs((a) => a.unstakePositions, address.toString()),

		transactionStatus: (
			txID: TransactionIdentifierT,
		): Observable<StatusOfTransaction> =>
			toObs((a) => a.statusOfTransaction, txID.toString()),

		networkTransactionThroughput: (): Observable<NetworkTransactionThroughput> =>
			toObs((a) => a.networkTransactionThroughput),

		networkTransactionDemand: (): Observable<NetworkTransactionDemand> =>
			toObs((a) => a.networkTransactionDemand),

		buildTransaction: (
			transactionIntent: TransactionIntent,
		): Observable<BuiltTransaction> =>
			toObs(
				(a) => a.buildTransaction,
				transactionIntent.actions.map((action) =>
					action.type === ActionType.TOKEN_TRANSFER
						? {
								type: action.type,
								from: action.from.toString(),
								to: action.to.toString(),
								amount: action.amount.toString(),
								tokenIdentifier: action.rri.toString(),
						  }
						: {
								type: action.type,
								from: action.from.toString(),
								validator: action.validator.toString(),
								amount: action.amount.toString(),
						  },
				),
				transactionIntent.message
					? transactionIntent.message.toString('hex')
					: undefined,
			),

		finalizeTransaction: (
			signedTransaction: SignedTransaction,
		): Observable<FinalizedTransaction> =>
			toObs(
				(a) => a.finalizeTransaction,
				{ blob: signedTransaction.transaction.blob },
				signedTransaction.signature.toDER(),
				signedTransaction.publicKeyOfSigner.toString(true),
			),

		submitSignedTransaction: (
			finalizedTx: FinalizedTransaction & SignedTransaction,
		): Observable<PendingTransaction> =>
			toObs(
				(a) => a.submitTransaction,
				{ blob: finalizedTx.transaction.blob },
				finalizedTx.signature.toDER(),
				finalizedTx.publicKeyOfSigner.toString(true),
				finalizedTx.txID.toString(),
			),
	}
}
