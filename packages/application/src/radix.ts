import {
	AccountsT,
	AccountT,
	AddressT,
	toObservable,
	WalletT,
} from '@radixdlt/account'
import {
	NodeT,
	RadixCoreAPI,
	RadixT,
	Token,
	TokenBalances,
	ExecutedTransactions,
	TokenFeeForTransaction,
	Stakes,
	TransactionStatus,
	NetworkTransactionThroughput,
	NetworkTransactionDemand,
	AtomFromTransactionResponse,
	SubmittedAtomResponse,
	SignedAtom,
} from './_types'
import { nodeAPI } from './api/api'

import { mergeMap, withLatestFrom, map } from 'rxjs/operators'
import { Observable, Subscription, merge, ReplaySubject, defer } from 'rxjs'
import { Magic, magicFromNumber } from '@radixdlt/primitives'
import { Transaction } from './api/json-rpc/_types'
import { ResultAsync } from 'neverthrow'
import { AtomIdentifierT } from '@radixdlt/atom'
import { NodeAPI } from './api/_types'

const radixCoreAPI = (node: NodeT): RadixCoreAPI => {
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

	return <RadixCoreAPI>{
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
				size: number
			}>,
		): Observable<ExecutedTransactions> =>
			toObs(
				(a) => a.executedTransactions,
				input.address.toString(),
				input.size,
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
			toObs((a) => a.submitSignedAtom, ...signedAtom),
	}
}

const create = (): RadixT => {
	const subs = new Subscription()

	const nodeSubject = new ReplaySubject<NodeT>()
	const coreAPISubject = new ReplaySubject<RadixCoreAPI>()
	const walletSubject = new ReplaySubject<WalletT>()

	const wallet$ = walletSubject.asObservable()

	const coreAPIViaNode$ = nodeSubject
		.asObservable()
		.pipe(map((n: NodeT) => radixCoreAPI(n)))

	const coreAPI$ = merge(coreAPIViaNode$, coreAPISubject.asObservable())

	const activeAddress$ = wallet$.pipe(
		mergeMap((wallet) => wallet.observeActiveAddress()),
	)

	const nativeToken = (): Observable<Token> =>
		coreAPI$.pipe(mergeMap((api: RadixCoreAPI) => api.nativeToken()))

	const tokenBalancesOfActiveAccount = (): Observable<TokenBalances> =>
		coreAPI$.pipe(
			withLatestFrom(activeAddress$),
			mergeMap(([api, activeAddress]) =>
				api.tokenBalancesForAddress(activeAddress),
			),
		)

	const magic$: Observable<Magic> = coreAPI$.pipe(
		mergeMap((api) => api.magic()),
	)

	const node$ = merge(
		nodeSubject.asObservable(),
		coreAPISubject.asObservable().pipe(map((api) => api.node)),
	)

	const observeActiveAddress = (): Observable<AddressT> =>
		wallet$.pipe(mergeMap((wallet) => wallet.observeActiveAddress()))

	const observeActiveAccount = (): Observable<AccountT> =>
		wallet$.pipe(mergeMap((wallet) => wallet.observeActiveAccount()))

	const observeAccounts = (): Observable<AccountsT> =>
		wallet$.pipe(mergeMap((wallet) => wallet.observeAccounts()))

	return {
		// Primarily useful for testing
		_withAPI: (radixCoreAPI$: Observable<RadixCoreAPI>): void => {
			radixCoreAPI$.subscribe((a) => coreAPISubject.next(a)).add(subs)
			return
		},

		withAPIAtNode: (node$: Observable<NodeT>): void => {
			node$.subscribe((n) => nodeSubject.next(n)).add(subs)
			return
		},

		withWallet: (wallet: WalletT): void => {
			// Important! We must provide wallet with `magic`,
			// so that it can derive addresses for its accounts.
			wallet.provideMagic(magic$)
			walletSubject.next(wallet)
		},

		observeWallet: () => wallet$,
		observeNode: () => node$,

		// Wallet APIs
		observeActiveAddress,
		observeActiveAccount,
		observeAccounts,

		// API
		nativeToken,
		tokenBalancesOfActiveAccount,
	}
}

export const Radix = {
	create,
}
