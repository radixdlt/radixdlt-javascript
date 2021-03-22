import {
	DeriveNextAccountInput,
	SwitchAccountInput,
	Wallet,
	WalletT,
} from '@radixdlt/account'
import { NodeT, RadixAPI, RadixCoreAPI } from './api/_types'

import {
	mergeMap,
	withLatestFrom,
	map,
	tap,
	shareReplay,
	switchMap,
	catchError,
} from 'rxjs/operators'
import {
	Observable,
	Subscription,
	merge,
	ReplaySubject,
	of,
	Subject,
	EMPTY,
} from 'rxjs'

import { radixCoreAPI } from './api/radixCoreAPI'
import { Magic } from '@radixdlt/primitives'
import { KeystoreT } from '@radixdlt/crypto'
import { ErrorNotification, ErrorTag, RadixT } from './_types'

const create = (): RadixT => {
	const subs = new Subscription()

	const nodeSubject = new ReplaySubject<NodeT>()
	const coreAPISubject = new ReplaySubject<RadixCoreAPI>()
	const walletSubject = new ReplaySubject<WalletT>()
	const errorNotificationSubject = new Subject<ErrorNotification>()

	const deriveAccountSubject = new Subject<DeriveNextAccountInput>()
	const switchAccountSubject = new Subject<SwitchAccountInput>()

	const wallet$ = walletSubject.asObservable()

	const coreAPIViaNode$ = nodeSubject
		.asObservable()
		.pipe(map((n: NodeT) => radixCoreAPI(n)))

	const coreAPI$ = merge(coreAPIViaNode$, coreAPISubject.asObservable()).pipe(
		shareReplay(1),
	)

	const activeAddress$ = wallet$.pipe(
		mergeMap((wallet) => wallet.observeActiveAddress()),
	)

	// Forwards calls to RadixCoreAPI, return type is a function: `(input?: I) => Observable<O>`
	const fwdAPICall = <I extends unknown[], O>(
		pickFn: (api: RadixCoreAPI) => (...input: I) => Observable<O>,
	) => (...input: I) =>
		coreAPI$.pipe(
			mergeMap((a) => pickFn(a)(...input)),
			catchError((error: Error) => {
				errorNotificationSubject.next({
					tag: ErrorTag.API,
					error,
				})
				return EMPTY
			}),
		)

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

	const tokenBalances = activeAddress$.pipe(
		withLatestFrom(coreAPI$),
		switchMap(([activeAddress, api]) =>
			api.tokenBalancesForAddress(activeAddress).pipe(
				catchError((error: Error) => {
					errorNotificationSubject.next({
						tag: ErrorTag.API,
						error,
					})
					return EMPTY
				}),
			),
		),
		shareReplay(1),
	)

	const node$ = merge(
		nodeSubject.asObservable(),
		coreAPISubject.asObservable().pipe(map((api) => api.node)),
	)

	const activeAddress = wallet$.pipe(
		mergeMap((wallet) => wallet.observeActiveAddress()),
		shareReplay(1),
	)

	const activeAccount = wallet$.pipe(
		mergeMap((wallet) => wallet.observeActiveAccount()),
		shareReplay(1),
	)

	const accounts = wallet$.pipe(
		mergeMap((wallet) => wallet.observeAccounts()),
		shareReplay(1),
	)

	const _withNodeConnection = (node: Observable<NodeT>): void => {
		node.subscribe(
			(n) => nodeSubject.next(n),
			(error: Error) => {
				errorNotificationSubject.next({
					tag: ErrorTag.NODE,
					error,
				})
			},
		).add(subs)
	}

	const _withWallet = (wallet: WalletT): void => {
		// Important! We must provide wallet with `magic`,
		// so that it can derive addresses for its accounts.
		wallet.provideMagic(magic())
		walletSubject.next(wallet)
	}

	deriveAccountSubject
		.pipe(
			withLatestFrom(wallet$),
			tap(([derivation, w]) => w.deriveNext(derivation)),
		)
		.subscribe()
		.add(subs)

	switchAccountSubject
		.pipe(
			withLatestFrom(wallet$),
			tap(([switchTo, w]) => w.switchAccount(switchTo)),
		)
		.subscribe()
		.add(subs)

	return {
		// we forward the full `RadixAPI`, but we also provide some convenience methods based on active account/address.
		api: {
			...api,
		},

		// Primarily useful for testing
		withNodeConnection: function (node$: Observable<NodeT>): RadixT {
			_withNodeConnection(node$)
			return this
		},
		__withAPI: function (radixCoreAPI$: Observable<RadixCoreAPI>): RadixT {
			radixCoreAPI$.subscribe((a) => coreAPISubject.next(a)).add(subs)
			return this
		},
		connect: function (url: URL): RadixT {
			_withNodeConnection(of({ url }))
			return this
		},

		withWallet: function (wallet: WalletT): RadixT {
			_withWallet(wallet)
			return this
		},

		login: function (
			password: string,
			loadKeystore: () => Promise<KeystoreT>,
		): RadixT {
			void Wallet.byLoadingAndDecryptingKeystore({
				password,
				load: loadKeystore,
			}).then((walletResult) => {
				walletResult.match(
					(w) => _withWallet(w),
					(error) => {
						errorNotificationSubject.next({
							tag: ErrorTag.WALLET,
							error,
						})
					},
				)
			})

			return this
		},

		errors: errorNotificationSubject.asObservable(),

		wallet: wallet$,
		node: node$,

		deriveNextAccount: function (input?: DeriveNextAccountInput): RadixT {
			const derivation: DeriveNextAccountInput = input ?? {}
			deriveAccountSubject.next(derivation)
			return this
		},

		switchAccount: function (input: SwitchAccountInput): RadixT {
			switchAccountSubject.next(input)
			return this
		},

		// Wallet APIs
		activeAddress,
		activeAccount,
		accounts,

		// Active Address/Account APIs
		tokenBalances,
	}
}

export const Radix = {
	create,
}
