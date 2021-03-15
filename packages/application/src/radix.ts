import { AccountsT, AccountT, AddressT, WalletT } from '@radixdlt/account'
import { NodeT, RadixCoreAPI, RadixT, Token, TokenBalances } from './_types'

import { mergeMap, withLatestFrom, map } from 'rxjs/operators'
import { Observable, Subscription, merge, ReplaySubject } from 'rxjs'
import { Magic } from '@radixdlt/primitives'

const radixCoreAPI = (_url: URL): Observable<RadixCoreAPI> => {
	throw new Error('impl me')
}

const create = (): RadixT => {
	const subs = new Subscription()

	const nodeSubject = new ReplaySubject<NodeT>()
	const coreAPISubject = new ReplaySubject<RadixCoreAPI>()
	const walletSubject = new ReplaySubject<WalletT>()

	const wallet$ = walletSubject.asObservable()

	const coreAPIViaNode$ = nodeSubject
		.asObservable()
		.pipe(mergeMap((node: NodeT) => radixCoreAPI(node.url)))

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
				api.tokenBalances(activeAddress),
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
