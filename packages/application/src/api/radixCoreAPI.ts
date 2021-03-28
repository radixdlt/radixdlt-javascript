import { NodeAPI, NodeT, RadixCoreAPI } from './_types'
import { nodeAPI } from './api'
import { ResultAsync } from 'neverthrow'
import { defer, Observable } from 'rxjs'
import { AddressT, toObservable } from '@radixdlt/account'
import { map } from 'rxjs/operators'
import { Magic } from '@radixdlt/primitives'
import {
	ExecutedTransaction,
	NetworkTransactionDemand,
	NetworkTransactionThroughput,
	PendingTransaction,
	ResourceIdentifierT,
	SignedTransaction,
	StakePositions,
	StatusOfTransaction,
	Token,
	TokenBalances,
	TransactionHistory,
	TransactionIdentifierT,
	TransactionIntent,
	UnsignedTransaction,
	UnstakePositions,
	Validators,
} from '../dto/_types'

export const radixCoreAPI = (node: NodeT): RadixCoreAPI => {
	const api = nodeAPI(node.url)

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

		validators: (): Observable<Validators> => toObs((a) => a.validators),

		lookupTransaction: (
			txID: TransactionIdentifierT,
		): Observable<ExecutedTransaction> =>
			toObs((a) => a.lookupTransaction, txID.toString()),

		magic: (): Observable<Magic> =>
			toObsMap(
				(a) => a.networkId,
				(m) => m.networkId,
			),

		tokenBalancesForAddress: (
			address: AddressT,
		): Observable<TokenBalances> =>
			toObs((a) => a.tokenBalances, address.toString()),

		transactionHistory: (
			input: Readonly<{
				address: AddressT

				// pagination
				size: number // must be larger than 0
				cursor?: TransactionIdentifierT
			}>,
		): Observable<TransactionHistory> =>
			toObs(
				(a) => a.transactionHistory,
				input.address.toString(),
				input.size,
				input.cursor?.toString(),
			),

		nativeToken: (): Observable<Token> => toObs((a) => a.nativeToken),
		tokenInfo: (rri: ResourceIdentifierT): Observable<Token> =>
			toObs((a) => a.tokenInfo, rri.toString()),

		stakesForAddress: (address: AddressT): Observable<StakePositions> =>
			toObs((a) => a.stakes, address.toString()),

		unstakesForAddress: (address: AddressT): Observable<UnstakePositions> =>
			toObs((a) => a.unstakes, address.toString()),

		transactionStatus: (
			txID: TransactionIdentifierT,
		): Observable<StatusOfTransaction> =>
			toObs((a) => a.transactionStatus, txID.toString()),

		networkTransactionThroughput: (): Observable<NetworkTransactionThroughput> =>
			toObs((a) => a.networkTransactionThroughput),

		networkTransactionDemand: (): Observable<NetworkTransactionDemand> =>
			toObs((a) => a.networkTransactionDemand),

		buildTransaction: (
			transactionIntent: TransactionIntent,
		): Observable<UnsignedTransaction> =>
			toObs((a) => a.buildTransaction, transactionIntent),

		submitSignedTransaction: (
			signedTransaction: SignedTransaction,
		): Observable<PendingTransaction> =>
			toObs(
				(a) => a.submitSignedTransaction,
				{ blob: signedTransaction.transaction.blob },
				signedTransaction.signature.toDER(),
			),
	}
}
