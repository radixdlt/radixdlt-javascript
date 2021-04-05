import {
	AccountT,
	AddressT,
	DeriveNextAccountInput,
	SwitchAccountInput,
	Wallet,
	WalletT,
} from '@radixdlt/account'
import { NodeT, RadixAPI, RadixCoreAPI } from './api/_types'

import {
	catchError,
	delay,
	distinctUntilChanged,
	filter,
	map,
	mergeMap,
	shareReplay,
	switchMap,
	takeWhile,
	tap,
	withLatestFrom,
} from 'rxjs/operators'
import {
	EMPTY,
	interval,
	merge,
	Observable,
	of,
	ReplaySubject,
	Subject,
	Subscription,
} from 'rxjs'
import { radixCoreAPI } from './api/radixCoreAPI'
import { Magic } from '@radixdlt/primitives'
import { KeystoreT, UnsignedMessage } from '@radixdlt/crypto'
import { RadixT } from './_types'
import {
	APIError,
	buildTxFromIntentErr,
	ErrorNotification,
	finalizeTxErr,
	getNodeErr,
	loadKeystoreErr,
	lookupTxErr,
	nativeTokenErr,
	networkIdErr,
	networkTxDemandErr,
	networkTxThroughputErr,
	stakesForAddressErr,
	submitSignedTxErr,
	tokenBalancesErr,
	tokenInfoErr,
	transactionHistoryErr,
	txStatusErr,
	unstakesForAddressErr,
	validatorsErr,
} from './errors'
import { log, LogLevel } from '@radixdlt/util'
import {
	PartOfMakeTransactionFlow,
	PendingTransaction,
	SignedUnconfirmedTransaction,
	SignedUnsubmittedTransaction,
	StatusOfTransaction,
	TransactionHistory,
	TransactionHistoryActiveAccountRequestInput,
	TransactionIdentifierT,
	TransactionIntent,
	TransactionIntentBuilderT,
	TransactionStatus,
	TransactionTracking,
	TransactionTrackingEvent,
	TransactionTrackingEventType,
	UnsignedTransaction,
} from './dto/_types'
import { TransferTokensInput } from './actions/_types'
import { nodeAPI } from './api/api'
import { TransactionIntentBuilder } from './dto/transactionIntentBuilder'

type EventTransactionInitiated = TransactionTrackingEvent<TransactionIntent>
const eventTransactionInitiated = (
	intent: TransactionIntent,
): EventTransactionInitiated => ({
	value: intent,
	eventUpdateType: TransactionTrackingEventType.INITIATED,
})

type EventTransactionBuildByAPI = TransactionTrackingEvent<UnsignedTransaction>
const eventTransactionBuiltByAPI = (
	unsignedTX: UnsignedTransaction,
): EventTransactionBuildByAPI => ({
	value: unsignedTX,
	eventUpdateType: TransactionTrackingEventType.BUILT_FROM_INTENT,
})

type EventTransactionSigned = TransactionTrackingEvent<SignedUnsubmittedTransaction>
const eventTransactionSigned = (
	signedTX: SignedUnsubmittedTransaction,
): EventTransactionSigned => ({
	value: signedTX,
	eventUpdateType: TransactionTrackingEventType.SIGNED,
})

type EventTransactionSubmitted = TransactionTrackingEvent<SignedUnconfirmedTransaction>
const eventTransactionSubmitted = (
	submitted: SignedUnconfirmedTransaction,
): EventTransactionSubmitted => ({
	value: submitted,
	eventUpdateType: TransactionTrackingEventType.SUBMITTED,
})

type EventTransactionAskedUserToConfirm = TransactionTrackingEvent<SignedUnconfirmedTransaction>
const eventTransactionAskingUserForFinalConfirmation = (
	userConfirmationInput: SignedUnconfirmedTransaction,
): EventTransactionAskedUserToConfirm => ({
	value: userConfirmationInput,
	eventUpdateType:
		TransactionTrackingEventType.ASKING_USER_FOR_FINAL_CONFIRMATION,
})

type EventTransactionUserDidConfirm = TransactionTrackingEvent<SignedUnconfirmedTransaction>
const eventTransactionUserDidConfirm = (
	userConfirmedTX: SignedUnconfirmedTransaction,
): EventTransactionUserDidConfirm => ({
	value: userConfirmedTX,
	eventUpdateType:
		TransactionTrackingEventType.USER_CONFIRMED_TX_BEFORE_FINALIZATION,
})

type EventTransactionFinalizedAndIsNowPending = TransactionTrackingEvent<PendingTransaction>
const eventTransactionFinalizedAndIsNowPending = (
	pendingTX: PendingTransaction,
): EventTransactionFinalizedAndIsNowPending => ({
	value: pendingTX,
	eventUpdateType: TransactionTrackingEventType.FINALIZED_AND_IS_NOW_PENDING,
})

type EventTransactionStatusUpdate = TransactionTrackingEvent<StatusOfTransaction>
const eventTransactionStatusUpdate = (
	statusOfTransaction: StatusOfTransaction,
): EventTransactionStatusUpdate => ({
	value: statusOfTransaction,
	eventUpdateType:
		TransactionTrackingEventType.UPDATE_OF_STATUS_OF_PENDING_TX,
})

type EventTransactionCompletedSuccessfully = TransactionTrackingEvent<StatusOfTransaction>
const eventTransactionCompletedSuccessfully = (
	statusOfTransaction: StatusOfTransaction,
): EventTransactionCompletedSuccessfully => ({
	value: statusOfTransaction,
	eventUpdateType: TransactionTrackingEventType.COMPLETED,
})

const create = (): RadixT => {
	const subs = new Subscription()

	const nodeSubject = new ReplaySubject<NodeT>()
	const coreAPISubject = new ReplaySubject<RadixCoreAPI>()
	const walletSubject = new ReplaySubject<WalletT>()
	const errorNotificationSubject = new Subject<ErrorNotification>()

	const deriveAccountSubject = new Subject<DeriveNextAccountInput>()
	const switchAccountSubject = new Subject<SwitchAccountInput>()

	const tokenBalanceFetchSubject = new Subject<number>()
	const stakingFetchSubject = new Subject<number>()
	const wallet$ = walletSubject.asObservable()

	const coreAPIViaNode$ = nodeSubject
		.asObservable()
		.pipe(map((n: NodeT) => radixCoreAPI(n, nodeAPI(n.url))))

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
		finalizeTransaction: fwdAPICall(
			(a) => a.finalizeTransaction,
			(m) => finalizeTxErr(m),
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
		stakingFetchSubject,
		(a) => a.stakesForAddress,
		stakesForAddressErr,
	)

	const unstakingPositions = activeAddressToAPIObservableWithTrigger(
		stakingFetchSubject,
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

	const signUnsignedTx = (
		unsignedTx: UnsignedTransaction,
	): Observable<SignedUnsubmittedTransaction> => {
		log.trace('Starting signing transaction (async).')
		return activeAccount.pipe(
			mergeMap(
				(
					account: AccountT,
				): Observable<SignedUnsubmittedTransaction> => {
					const msgToSignFromTx: UnsignedMessage = {
						hashedMessage: Buffer.from(
							unsignedTx.transaction.hashOfBlobToSign,
							'hex',
						),
					}
					return account.sign(msgToSignFromTx).pipe(
						withLatestFrom(account.derivePublicKey()),
						map(
							([
								signature,
								publicKeyOfSigner,
							]): SignedUnsubmittedTransaction => {
								log.trace(`Finished signing transaction`)
								return {
									transaction: unsignedTx.transaction,
									signature,
									publicKeyOfSigner,
								}
							},
						),
					)
				},
			),
		)
	}

	const __makeTransactionFromIntent = (
		transactionIntent$: Observable<TransactionIntent>,
		pollTXStatusTrigger?: Observable<unknown>,
	): TransactionTracking => {
		log.trace(
			`Start of transaction flow, inside constructor of 'TransactionTracking'.`,
		)

		const pendingTXSubject = new Subject<PendingTransaction>()

		/// ===== user facing ⬇️ ===
		const askUserToConfirmSubject = new Subject<SignedUnconfirmedTransaction>()
		const userDidConfirmTransactionSubject = new Subject<SignedUnconfirmedTransaction>()
		const trackingSubject = new ReplaySubject<
			TransactionTrackingEvent<PartOfMakeTransactionFlow>
		>()
		/// ===== user facing ⬆️ ===

		const track = (
			event: TransactionTrackingEvent<PartOfMakeTransactionFlow>,
		): void => {
			trackingSubject.next(event)
		}

		const build$ = transactionIntent$.pipe(
			mergeMap(
				(
					intent: TransactionIntent,
				): Observable<UnsignedTransaction> => {
					log.debug(
						'Transaction intent created => requesting 🛰 API to build it now.',
					)
					track(eventTransactionInitiated(intent))
					return api.buildTransaction(intent)
				},
			),
		)

		const sign$ = build$.pipe(
			mergeMap(
				(
					unsignedTX: UnsignedTransaction,
				): Observable<SignedUnsubmittedTransaction> => {
					log.debug('TX built by API => starting signing of it now.')
					track(eventTransactionBuiltByAPI(unsignedTX))
					return signUnsignedTx(unsignedTX)
				},
			),
		)

		const submit$ = sign$.pipe(
			mergeMap(
				(
					signedTx: SignedUnsubmittedTransaction,
				): Observable<SignedUnconfirmedTransaction> => {
					log.debug(`Finished signing tx => submitting it to API.`)
					track(eventTransactionSigned(signedTx))
					return api.submitSignedTransaction(signedTx)
				},
			),
		)

		submit$
			.subscribe(
				(
					unconfirmedSignedSubmittedTx: SignedUnconfirmedTransaction,
				) => {
					log.debug(
						`Received submitted transaction with txID ${unconfirmedSignedSubmittedTx.txID.toString()} from API => asking user to confirm it now.`,
					)
					track(
						eventTransactionSubmitted(unconfirmedSignedSubmittedTx),
					)

					track(
						eventTransactionAskingUserForFinalConfirmation(
							unconfirmedSignedSubmittedTx,
						),
					)

					askUserToConfirmSubject.next(unconfirmedSignedSubmittedTx)
				},
			)
			.add(subs)

		const finalize$ = userDidConfirmTransactionSubject.pipe(
			mergeMap(
				(
					userConfirmedTX: SignedUnconfirmedTransaction,
				): Observable<PendingTransaction> => {
					log.debug('User did confirm tx => finalizing it now.')
					track(eventTransactionUserDidConfirm(userConfirmedTX))
					return api.finalizeTransaction(userConfirmedTX)
				},
			),
		)

		finalize$
			.subscribe({
				next: (pendingTx: PendingTransaction) => {
					log.debug(
						`Finalized transaction with txID: '${pendingTx.txID.toString()}', it is now pending.`,
					)
					track(eventTransactionFinalizedAndIsNowPending(pendingTx))
					pendingTXSubject.next(pendingTx)
				},
				error: (submitTXError: Error) => {
					// TODO would be great to have access to txID here, hopefully API includes it in error msg?
					log.error(
						`Submission of signed transaction to API failed with error: ${submitTXError.message}`,
					)
					pendingTXSubject.error(submitTXError)
				},
			})
			.add(subs)

		const pollTxStatusTrigger = pollTXStatusTrigger ?? interval(5 * 1_000) // every 5 seconds

		const transactionStatus$ = pollTxStatusTrigger.pipe(
			withLatestFrom(pendingTXSubject),
			mergeMap(([_, pendingTx]) => {
				log.debug(
					`Asking API for status of transaction with txID: ${pendingTx.txID.toString()}`,
				)
				return api.transactionStatus(pendingTx.txID)
			}),
		)

		const transactionCompletedWithStatusConfirmed$ = transactionStatus$.pipe(
			takeWhile(({ status }) => status !== TransactionStatus.CONFIRMED),
		)

		transactionStatus$
			.subscribe({
				next: (statusOfTransaction) => {
					const { status, txID } = statusOfTransaction
					log.trace(
						`Status ${status.toString()} of tx with id: ${txID.toString()}`,
					)
					track(eventTransactionStatusUpdate(statusOfTransaction))
				},
				error: (transactionStatusError: Error) => {
					// TODO hmm how to get txID here?
					log.error(
						`Failed to get status of transaction, error: ${transactionStatusError.message}`,
					)
				},
			})
			.add(subs)

		transactionCompletedWithStatusConfirmed$
			.pipe(
				delay(50), // Delay for a few MILLIseconds, just so that transactionStatus observable can emit before this. Merely a cosmetic thing.
			)
			.subscribe({
				next: (statusOfTransaction) => {
					const { txID } = statusOfTransaction
					log.info(
						`Transaction with txID='${txID.toString()}' has completed succesfully.`,
					)
					track(
						eventTransactionCompletedSuccessfully(
							statusOfTransaction,
						),
					)
				},
			})
			.add(subs)

		return {
			askUserToConfirmTransaction: askUserToConfirmSubject.asObservable(),
			userDidConfirmTransactionSubject,
			tracking: trackingSubject.asObservable(),
		}
	}

	const __makeTransactionFromBuilder = (
		transactionIntentBuilderT: TransactionIntentBuilderT,
		pollTXStatusTrigger?: Observable<unknown>,
	): TransactionTracking => {
		log.debug(`make transaction from builder`)
		const intent$ = transactionIntentBuilderT.build({
			encryptMessageIfAnyWithAccount: activeAccount,
		})
		return __makeTransactionFromIntent(intent$, pollTXStatusTrigger)
	}

	const transferTokens = (
		input: TransferTokensInput,
		pollTXStatusTrigger?: Observable<unknown>,
	): TransactionTracking => {
		log.debug(`transferTokens`)
		return __makeTransactionFromBuilder(
			TransactionIntentBuilder.create().transferTokens(input),
			pollTXStatusTrigger,
		)
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

		transactionStatus: (
			txID: TransactionIdentifierT,
			trigger: Observable<number>,
		) => {
			return trigger.pipe(
				mergeMap((_) => api.transactionStatus(txID)),
				distinctUntilChanged((prev, cur) => prev.status === cur.status),
				filter(({ txID }) => txID.equals(txID)),
			)
		},

		withTokenBalanceFetchTrigger: function (trigger: Observable<number>) {
			trigger.subscribe(tokenBalanceFetchSubject).add(subs)
			return this
		},
		withStakingFetchTrigger: function (trigger: Observable<number>) {
			trigger.subscribe(stakingFetchSubject).add(subs)
			return this
		},

		transferTokens,

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
