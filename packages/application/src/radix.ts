import {
	AddressT,
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
	throwError,
} from 'rxjs'

import { radixCoreAPI } from './api/radixCoreAPI'
import { Magic } from '@radixdlt/primitives'
import { KeystoreT } from '@radixdlt/crypto'
import { RadixT } from './_types'
import {
	ErrorNotification,
	nativeTokenErr,
	networkTxDemandErr,
	networkTxThroughputErr,
	getNodeErr,
	transactionHistoryErr,
	buildTxFromIntentErr,
	submitSignedTxErr,
	stakesForAddressErr,
	networkIdErr,
	tokenBalancesErr,
	tokenInfoErr,
	txStatusErr,
	loadKeystoreErr,
	unstakesForAddressErr,
	validatorsErr,
	lookupTxErr,
	ErrorCategory,
	ErrorCause,
	ErrorT,
	APIError,
	APIErrorCause,
} from './errors'
import { log, LogLevel } from '@radixdlt/util'
import {
	StakePositions,
	TransactionHistory,
	TransactionHistoryActiveAccountRequestInput,
	UnstakePositions,
} from './dto/_types'

const create = (): RadixT => {
	const subs = new Subscription()

	const nodeSubject = new ReplaySubject<NodeT>()
	const coreAPISubject = new ReplaySubject<RadixCoreAPI>()
	const walletSubject = new ReplaySubject<WalletT>()
	const errorNotificationSubject = new Subject<ErrorNotification>()

	const deriveAccountSubject = new Subject<DeriveNextAccountInput>()
	const switchAccountSubject = new Subject<SwitchAccountInput>()

	const tokenBalanceFetchSubject = new Subject<number>()
	const unstakeFetchSubject = new Subject<number>()
	const stakeFetchSubject = new Subject<number>()
	const wallet$ = walletSubject.asObservable()

	const coreAPIViaNode$ = nodeSubject
		.asObservable()
		.pipe(map((n: NodeT) => radixCoreAPI(n)))

	const coreAPI$ = merge(coreAPIViaNode$, coreAPISubject.asObservable()).pipe(
		shareReplay(1),
	)
	// Forwards calls to RadixCoreAPI, return type is a function: `(input?: I) => Observable<O>`
	const fwdAPICall = <I extends unknown[], O>(
		pickFn: (api: RadixCoreAPI) => (...input: I) => Observable<O>,
		errorFn: (message: string) => ErrorNotification,
	) => (...input: I) =>
		coreAPI$.pipe(
			mergeMap((a) => pickFn(a)(...input)),
			catchError((error: Error) => {
				errorNotificationSubject.next(errorFn(error.message))
				return EMPTY
			}),
		)

	const networkId: () => Observable<Magic> = fwdAPICall(
		(a) => a.networkId,
		(m) => networkIdErr(m),
	)

	const api: RadixAPI = {
		networkId,
		tokenBalancesForAddress: fwdAPICall(
			(a) => a.tokenBalancesForAddress,
			(m) => tokenBalancesErr(m),
		),
		transactionHistory: fwdAPICall(
			(a) => a.transactionHistory,
			(m) => transactionHistoryErr(m),
		),
		nativeToken: fwdAPICall(
			(a) => a.nativeToken,
			(m) => nativeTokenErr(m),
		),
		tokenInfo: fwdAPICall(
			(a) => a.tokenInfo,
			(m) => tokenInfoErr(m),
		),
		stakesForAddress: fwdAPICall(
			(a) => a.stakesForAddress,
			(m) => stakesForAddressErr(m),
		),
		unstakesForAddress: fwdAPICall(
			(a) => a.unstakesForAddress,
			(m) => unstakesForAddressErr(m),
		),

		validators: fwdAPICall(
			(a) => a.validators,
			(m) => validatorsErr(m),
		),

		lookupTransaction: fwdAPICall(
			(a) => a.lookupTransaction,
			(m) => lookupTxErr(m),
		),

		transactionStatus: fwdAPICall(
			(a) => a.transactionStatus,
			(m) => txStatusErr(m),
		),
		networkTransactionThroughput: fwdAPICall(
			(a) => a.networkTransactionThroughput,
			(m) => networkTxThroughputErr(m),
		),
		networkTransactionDemand: fwdAPICall(
			(a) => a.networkTransactionDemand,
			(m) => networkTxDemandErr(m),
		),
		buildTransaction: fwdAPICall(
			(a) => a.buildTransaction,
			(m) => buildTxFromIntentErr(m),
		),
		submitSignedTransaction: fwdAPICall(
			(a) => a.submitSignedTransaction,
			(m) => submitSignedTxErr(m),
		),
	}

	const activeAddress = wallet$.pipe(
		mergeMap((wallet) => wallet.observeActiveAddress()),
		shareReplay(1),
	)

	const activeAddressToAPIObservableWithTrigger = <O>(
		trigger: Observable<number>,
		pickFn: (api: RadixCoreAPI) => (address: AddressT) => Observable<O>,
		errorFn: (errorMessage: string) => APIError,
	): Observable<O> =>
		merge(
			trigger.pipe(
				withLatestFrom(activeAddress),
				map((result) => result[1]),
			),
			activeAddress,
		).pipe(
			withLatestFrom(coreAPI$),
			switchMap(([address, api]) =>
				pickFn(api)(address).pipe(
					catchError((error: Error) => {
						errorNotificationSubject.next(errorFn(error.message))
						return EMPTY
					}),
				),
			),
			shareReplay(1),
		)

	const tokenBalances = activeAddressToAPIObservableWithTrigger(
		tokenBalanceFetchSubject,
		(a) => a.tokenBalancesForAddress,
		tokenBalancesErr,
	)

	const stakingPositions = activeAddressToAPIObservableWithTrigger(
		stakeFetchSubject,
		(a) => a.stakesForAddress,
		stakesForAddressErr,
	)

	const unstakingPositions = activeAddressToAPIObservableWithTrigger(
		unstakeFetchSubject,
		(a) => a.unstakesForAddress,
		unstakesForAddressErr,
	)

	const transactionHistory = (
		input: TransactionHistoryActiveAccountRequestInput,
	): Observable<TransactionHistory> =>
		activeAddress.pipe(
			withLatestFrom(coreAPI$),
			switchMap(([activeAddress, api]) =>
				api
					.transactionHistory({ ...input, address: activeAddress })
					.pipe(
						catchError((error: Error) => {
							errorNotificationSubject.next(
								transactionHistoryErr(error.message),
							)
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

	const activeAccount = wallet$.pipe(
		mergeMap((wallet) => wallet.observeActiveAccount()),
		shareReplay(1),
	)

	const accounts = wallet$.pipe(
		mergeMap((wallet) => wallet.observeAccounts()),
		shareReplay(1),
	)

	const _withNode = (node: Observable<NodeT>): void => {
		node.subscribe(
			(n) => nodeSubject.next(n),
			(error: Error) => {
				errorNotificationSubject.next(getNodeErr(error.message))
			},
		).add(subs)
	}

	const _withWallet = (wallet: WalletT): void => {
		// Important! We must provide wallet with `magic`,
		// so that it can derive addresses for its accounts.
		wallet.provideNetworkId(networkId())
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
		ledger: {
			...api,
		},

		__wallet: wallet$,
		__node: node$,

		// Primarily useful for testing
		withNodeConnection: function (node$: Observable<NodeT>): RadixT {
			_withNode(node$)
			return this
		},
		__withAPI: function (radixCoreAPI$: Observable<RadixCoreAPI>): RadixT {
			radixCoreAPI$.subscribe((a) => coreAPISubject.next(a)).add(subs)
			return this
		},
		connect: function (url: URL): RadixT {
			_withNode(of({ url }))
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
						errorNotificationSubject.next(
							loadKeystoreErr(error.message),
						)
					},
				)
			})

			return this
		},

		errors: errorNotificationSubject.asObservable(),

		deriveNextAccount: function (input?: DeriveNextAccountInput): RadixT {
			const derivation: DeriveNextAccountInput = input ?? {}
			deriveAccountSubject.next(derivation)
			return this
		},

		switchAccount: function (input: SwitchAccountInput): RadixT {
			switchAccountSubject.next(input)
			return this
		},

		logLevel: function (level: LogLevel) {
			log.setLevel(level)
			return this
		},

		withTokenBalanceFetchTrigger: function (trigger: Observable<number>) {
			trigger.subscribe(tokenBalanceFetchSubject).add(subs)

			return this
		},

		// Wallet APIs
		activeAddress,
		activeAccount,
		accounts,

		// Active Address/Account APIs
		tokenBalances,
		stakingPositions,
		unstakingPositions,

		// Methods
		transactionHistory,
	}
}

export const Radix = {
	create,
}
