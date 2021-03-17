import { AccountsT, AccountT, AddressT, WalletT } from '@radixdlt/account'
import { NodeT, RadixAPI, RadixCoreAPI, RadixT, TokenBalances } from './_types'

import { mergeMap, withLatestFrom, map } from 'rxjs/operators'
import { Observable, Subscription, merge, ReplaySubject, of } from 'rxjs'

import { radixCoreAPI } from './api/radixCoreAPI'
import { Magic } from '@radixdlt/primitives'

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

	// Forwards calls to RadixCoreAPI, return type is a function: `(input?: I) => Observable<O>`
	const fwdAPICall = <I extends unknown[], O>(
		pickFn: (api: RadixCoreAPI) => (...input: I) => Observable<O>,
	) => (...input: I) => coreAPI$.pipe(mergeMap((a) => pickFn(a)(...input)))

	const magic: () => Observable<Magic> = fwdAPICall((a) => a.magic)

	const api: RadixAPI = {
		tokenBalancesForAddress: fwdAPICall((a) => a.tokenBalancesForAddress),
		executedTransactions: fwdAPICall((a) => a.executedTransactions),
		nativeToken: fwdAPICall((a) => a.nativeToken),
		tokenFeeForTransaction: fwdAPICall((a) => a.tokenFeeForTransaction),
		stakesForAddress: fwdAPICall((a) => a.stakesForAddress),
		transactionStatus: fwdAPICall((a) => a.transactionStatus),
		networkTransactionThroughput: fwdAPICall(
			(a) => a.networkTransactionThroughput,
		),
		networkTransactionDemand: fwdAPICall((a) => a.networkTransactionDemand),
		getAtomForTransaction: fwdAPICall((a) => a.getAtomForTransaction),
		submitSignedAtom: fwdAPICall((a) => a.submitSignedAtom),
	}

	const tokenBalancesOfActiveAccount = (): Observable<TokenBalances> =>
		coreAPI$.pipe(
			withLatestFrom(activeAddress$),
			mergeMap(([api, activeAddress]) =>
				api.tokenBalancesForAddress(activeAddress),
			),
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

	const _withNodeConnection = (node$: Observable<NodeT>): void => {
		node$
			.subscribe(
				(n) => nodeSubject.next(n),
				(e) => nodeSubject.error(e),
			)
			.add(subs)
	}

	return {
		// we forward the full `RadixAPI`, but we also provide some convenience methods based on active account/address.
		...api,

		// Primarily useful for testing
		withNodeConnection: function withNodeConnection(
			node$: Observable<NodeT>,
		): RadixT {
			_withNodeConnection(node$)
			/* eslint-disable functional/no-this-expression */
			return this
		},
		__withAPI: function __withAPI(
			radixCoreAPI$: Observable<RadixCoreAPI>,
		): RadixT {
			radixCoreAPI$
				.subscribe(
					(a) => coreAPISubject.next(a),
					(e) => coreAPISubject.error(e),
				)
				.add(subs)
			return this
		},
		connect: function connect(url: URL): RadixT {
			_withNodeConnection(of({ url }))
			return this
		},
		withWallet: function (wallet: WalletT): RadixT {
			// Important! We must provide wallet with `magic`,
			// so that it can derive addresses for its accounts.
			wallet.provideMagic(magic())
			walletSubject.next(wallet)
			return this
			/* eslint-enable functional/no-this-expression */
		},

		observeWallet: () => wallet$,
		observeNode: () => node$,

		// Wallet APIs
		observeActiveAddress,
		observeActiveAccount,
		observeAccounts,

		// Active Address/Account APIs
		tokenBalancesOfActiveAccount,
	}
}

export const Radix = {
	create,
}
