import {
	AtomFromTransactionResponse,
	ExecutedTransactions,
	NetworkTransactionDemand,
	NetworkTransactionThroughput,
	NodeT,
	RadixCoreAPI,
	SignedAtom,
	Stakes,
	SubmittedAtomResponse,
	Token,
	TokenBalances,
	TokenFeeForTransaction,
	TransactionStatus,
} from '../_types'
import { NodeAPI } from './_types'
import { nodeAPI } from './api'
import { ResultAsync } from 'neverthrow'
import { defer, Observable } from 'rxjs'
import { AddressT, toObservable } from '@radixdlt/account'
import { map } from 'rxjs/operators'
import { Magic, magicFromNumber } from '@radixdlt/primitives'
import { Transaction } from './json-rpc/_types'
import { AtomIdentifierT } from '@radixdlt/atom'

export const radixCoreAPI = (node: NodeT): RadixCoreAPI => {
	const rpcAPI: NodeAPI = nodeAPI(node.url)

	const toObs = <I extends unknown[], E, O>(
		pickFn: (api: NodeAPI) => (...input: I) => ResultAsync<O, E | E[]>,
		...input: I
	): Observable<O> => {
		return defer(() => {
			const fn: (...input: I) => ResultAsync<O, E | E[]> = pickFn(rpcAPI)
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

		magic: (): Observable<Magic> =>
			toObsMap(
				(a) => a.universeMagic,
				(m) => magicFromNumber(m.magic),
			),

		tokenBalancesForAddress: (
			address: AddressT,
		): Observable<TokenBalances> =>
			toObs((a) => a.tokenBalances, address.toString()),

		executedTransactions: (
			input: Readonly<{
				address: AddressT

				// pagination
				size: number // must be larger than 0
				cursor?: AtomIdentifierT
			}>,
		): Observable<ExecutedTransactions> =>
			toObs(
				(a) => a.executedTransactions,
				input.address.toString(),
				input.size,
				input.cursor?.toString(),
			),

		nativeToken: (): Observable<Token> => toObs((a) => a.nativeToken),

		tokenFeeForTransaction: (
			transaction: Transaction,
		): Observable<TokenFeeForTransaction> =>
			toObs((a) => a.tokenFeeForTransaction, transaction),

		stakesForAddress: (address: AddressT): Observable<Stakes> =>
			toObs((a) => a.stakes, address.toString()),
		transactionStatus: (
			atomIdentifier: AtomIdentifierT,
		): Observable<TransactionStatus> =>
			toObs((a) => a.transactionStatus, atomIdentifier.toString()),

		networkTransactionThroughput: (): Observable<NetworkTransactionThroughput> =>
			toObs((a) => a.networkTransactionThroughput),

		networkTransactionDemand: (): Observable<NetworkTransactionDemand> =>
			toObs((a) => a.networkTransactionDemand),

		getAtomForTransaction: (
			transaction: Transaction,
		): Observable<AtomFromTransactionResponse> =>
			toObs((a) => a.getAtomForTransaction, transaction),

		submitSignedAtom: (
			signedAtom: SignedAtom,
		): Observable<SubmittedAtomResponse> =>
			toObs((a) => a.submitSignedAtom,
				signedAtom.atomCBOR,
				signedAtom.signerPublicKey.toString(true),
				signedAtom.signature.toDER(),
			),
	}
}
