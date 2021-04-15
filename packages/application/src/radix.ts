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
	distinctUntilChanged,
	filter,
	map,
	mergeMap,
	shareReplay,
	skipWhile,
	switchMap,
	take,
	takeWhile,
	tap,
	withLatestFrom,
} from 'rxjs/operators'
import {
	combineLatest,
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
import { KeystoreT } from '@radixdlt/crypto'
import {
	MakeTransactionOptions,
	ManualUserConfirmTX,
	RadixT,
	StakeOptions,
	TransactionConfirmationBeforeFinalization,
	TransferTokensOptions,
	UnstakeOptions,
} from './_types'
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
import { isArray, log, LogLevel } from '@radixdlt/util'
import {
	PartOfMakeTransactionFlow,
	PendingTransaction,
	FinalizedTransaction,
	SignedTransaction,
	TransactionHistory,
	TransactionHistoryActiveAccountRequestInput,
	TransactionIdentifierT,
	TransactionIntent,
	TransactionIntentBuilderT,
	TransactionStatus,
	TransactionTracking,
	TransactionTrackingEvent,
	TransactionTrackingEventType,
	TXError,
	BuiltTransaction,
	SimpleTokenBalances,
	TokenBalances,
	SimpleTokenBalance,
	TokenBalance,
	Token,
} from './dto/_types'
import { nodeAPI } from './api/api'
import { TransactionIntentBuilder } from './dto/transactionIntentBuilder'

const shouldConfirmTransactionAutomatically = (
	confirmationScheme: TransactionConfirmationBeforeFinalization,
): confirmationScheme is 'skip' => confirmationScheme === 'skip'

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
		errorFn: (message: string | Error[]) => ErrorNotification,
	) => (...input: I) =>
		coreAPI$.pipe(
			mergeMap((a) => pickFn(a)(...input)),

			// We do NOT omit/supress error, we merely DECORATE the error
			catchError((errors: unknown) => {
				const errorsToPropagate: unknown[] = isArray(errors)
					? errors
					: [errors]

				throw errorFn(errorsToPropagate as Error[])
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
		finalizeTransaction: fwdAPICall(
			(a) => a.finalizeTransaction,
			(m) => finalizeTxErr(m),
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

	const simpleTokenBalances = activeAddressToAPIObservableWithTrigger(
		tokenBalanceFetchSubject,
		(a) => a.tokenBalancesForAddress,
		tokenBalancesErr,
	)

	const decorateSimpleTokenBalanceWithTokenInfo = (
		simpleTokenBalance: SimpleTokenBalance,
	): Observable<TokenBalance> => {
		return api.tokenInfo(simpleTokenBalance.token).pipe(
			map(
				(tokenInfo: Token): TokenBalance => ({
					amount: simpleTokenBalance.amount,
					token: tokenInfo,
				}),
			),
		)
	}

	const tokenBalances: Observable<TokenBalances> = simpleTokenBalances.pipe(
		mergeMap(
			(
				simpleTokenBalances: SimpleTokenBalances,
			): Observable<TokenBalances> => {
				const balanceOfTokensObservableList: Observable<TokenBalance>[] = simpleTokenBalances.tokenBalances.map(
					decorateSimpleTokenBalanceWithTokenInfo,
				)

				return combineLatest(balanceOfTokensObservableList).pipe(
					map(
						(tokenBalances: TokenBalance[]): TokenBalances => {
							return {
								owner: simpleTokenBalances.owner,
								tokenBalances,
							}
						},
					),
				)
			},
		),
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
			(n) => {
				log.info(`Using node ${n.url.toString()}`)
				nodeSubject.next(n)
			},
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
		unsignedTx: BuiltTransaction,
	): Observable<SignedTransaction> => {
		/* log.trace */ log.debug('Starting signing transaction (async).')
		return activeAccount.pipe(
			mergeMap(
				(account: AccountT): Observable<SignedTransaction> => {
					const msgToSignFromTx = Buffer.from(
						unsignedTx.transaction.hashOfBlobToSign,
						'hex',
					)
					return account.sign(msgToSignFromTx).pipe(
						withLatestFrom(account.derivePublicKey()),
						map(
							([
								signature,
								publicKeyOfSigner,
							]): SignedTransaction => {
								/* log.trace */ log.debug(
									`Finished signing transaction`,
								)
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
		options: MakeTransactionOptions,
	): TransactionTracking => {
		/* log.trace */ log.debug(
			`Start of transaction flow, inside constructor of 'TransactionTracking'.`,
		)

		const pendingTXSubject = new Subject<PendingTransaction>()

		const askUserToConfirmSubject = new Subject<BuiltTransaction>()
		const userDidConfirmTransactionSubject = new Subject<0>()

		if (shouldConfirmTransactionAutomatically(options.userConfirmation)) {
			/* log.trace */ log.debug(
				'Transaction has been setup to be automatically confirmed, requiring no final confirmation input from user.',
			)
			askUserToConfirmSubject
				.subscribe(() => {
					log.debug(
						`askUserToConfirmSubject got 'next', calling 'next' on 'userDidConfirmTransactionSubject'`,
					)
					userDidConfirmTransactionSubject.next(0)
				})
				.add(subs)
		} else {
			/* log.trace */ log.debug(
				`Transaction has been setup so that it requires a manual final confirmation from user before being finalized.`,
			)
			const twoWayConfirmationSubject: Subject<ManualUserConfirmTX> =
				options.userConfirmation

			askUserToConfirmSubject
				.subscribe((ux) => {
					/* log.trace */ log.debug(
						`Forwarding signedUnconfirmedTX and 'userDidConfirmTransactionSubject' to subject 'twoWayConfirmationSubject' now (inside subscribe to 'askUserToConfirmSubject')`,
					)

					const confirmation: ManualUserConfirmTX = {
						txToConfirm: ux,
						confirm: () => userDidConfirmTransactionSubject.next(0),
					}
					twoWayConfirmationSubject.next(confirmation)
				})
				.add(subs)
		}

		const trackingSubject = new ReplaySubject<
			TransactionTrackingEvent<PartOfMakeTransactionFlow>
		>()

		const track = (
			event: TransactionTrackingEvent<PartOfMakeTransactionFlow>,
		): void => {
			trackingSubject.next(event)
		}

		const completionSubject = new Subject<TransactionIdentifierT>()

		const trackError = (
			input: Readonly<{
				error: Error
				inStep: TransactionTrackingEventType
			}>,
		): void => {
			const errorEvent: TransactionTrackingEvent<TXError> = {
				eventUpdateType: input.inStep,
				value: input.error,
			}
			/* log.trace */ log.debug(`Forwarding error to 'errorSubject'`)
			track(errorEvent)
			completionSubject.error(errorEvent.value)
		}

		const builtTransaction = transactionIntent$.pipe(
			switchMap(
				(intent: TransactionIntent): Observable<BuiltTransaction> => {
					log.debug(
						'Transaction intent created => requesting 🛰 API to build it now.',
					)
					track({
						value: intent,
						eventUpdateType: TransactionTrackingEventType.INITIATED,
					})
					return api.buildTransaction(intent)
				},
			),
			catchError((e: Error) => {
				log.error(
					`API failed to build transaction, error: ${JSON.stringify(
						e,
						null,
						4,
					)}`,
				)
				trackError({
					error: e,
					inStep: TransactionTrackingEventType.BUILT_FROM_INTENT,
				})
				return EMPTY
			}),
			tap((builtTx) => {
				log.debug('TX built by API => starting signing of it now.')
				track({
					value: builtTx,
					eventUpdateType:
						TransactionTrackingEventType.BUILT_FROM_INTENT,
				})
				askUserToConfirmSubject.next(builtTx)
			}),
			tap((builtTx) => {
				track({
					value: builtTx,
					eventUpdateType:
						TransactionTrackingEventType.ASKED_FOR_CONFIRMATION,
				})
			}),
		)

		combineLatest([builtTransaction, userDidConfirmTransactionSubject])
			.pipe(
				map(([unsignedTx, _]) => unsignedTx),
				tap((unsignedTx) => {
					track({
						value: unsignedTx,
						eventUpdateType: TransactionTrackingEventType.CONFIRMED,
					})
				}),
				mergeMap((unsignedTx) => signUnsignedTx(unsignedTx)),
				mergeMap(
					(
						signedTx: SignedTransaction,
					): Observable<FinalizedTransaction> => {
						log.debug(`Finished signing tx => finalizing it.`)
						track({
							value: signedTx,
							eventUpdateType:
								TransactionTrackingEventType.SIGNED,
						})
						return api.finalizeTransaction(signedTx)
					},
				),
				catchError((e: Error) => {
					log.error(
						`API failed to finalize transaction, error: ${JSON.stringify(
							e,
							null,
							4,
						)}`,
					)
					trackError({
						error: e,
						inStep: TransactionTrackingEventType.FINALIZED,
					})
					return EMPTY
				}),
				tap<FinalizedTransaction>((finalizedTx) => {
					log.debug(
						`Received finalized transaction with txID='${finalizedTx.txID.toString()}' from API, calling submit.`,
					)
					track({
						value: finalizedTx,
						eventUpdateType: TransactionTrackingEventType.FINALIZED,
					})
				}),
				mergeMap(
					(
						finalizedTx: FinalizedTransaction,
					): Observable<PendingTransaction> => {
						return api.submitSignedTransaction(finalizedTx)
					},
				),
				catchError((e: Error) => {
					log.error(
						`API failed to submit transaction, error: ${JSON.stringify(
							e,
							null,
							4,
						)}`,
					)
					trackError({
						error: e,
						inStep:
							TransactionTrackingEventType.SUBMITTED,
					})
					return EMPTY
				}),
				tap({
					next: (pendingTx: PendingTransaction) => {
						log.debug(
							`Submitted transaction with txID='${pendingTx.txID.toString()}', it is now pending.`,
						)
						track({
							value: pendingTx,
							eventUpdateType:
								TransactionTrackingEventType.SUBMITTED,
						})
						pendingTXSubject.next(pendingTx)
					},
					error: (submitTXError: Error) => {
						// TODO would be great to have access to txID here, hopefully API includes it in error msg?
						log.error(
							`Submission of signed transaction to API failed with error: ${submitTXError.message}`,
						)
						pendingTXSubject.error(submitTXError)
					},
				}),
			)
			.subscribe()
			.add(subs)

		const pollTxStatusTrigger =
			options.pollTXStatusTrigger ?? interval(5 * 1_000) // every 5 seconds

		const transactionStatus$ = pollTxStatusTrigger.pipe(
			withLatestFrom(pendingTXSubject),
			mergeMap(([_, pendingTx]) => {
				log.debug(
					`Asking API for status of transaction with txID: ${pendingTx.txID.toString()}`,
				)
				return api.transactionStatus(pendingTx.txID)
			}),
			takeWhile(
				({ status }) => status === TransactionStatus.PENDING,
				true,
			),
		)

		const transactionCompletedWithStatusConfirmed$ = transactionStatus$.pipe(
			skipWhile(({ status }) => status === TransactionStatus.PENDING),
			take(1),
		)

		transactionStatus$
			.subscribe({
				next: (statusOfTransaction) => {
					const { status, txID } = statusOfTransaction
					/* log.trace */ log.debug(
						`Status ${status.toString()} of transaction with txID='${txID.toString()}'`,
					)
					track({
						value: statusOfTransaction,
						eventUpdateType:
							TransactionTrackingEventType.UPDATE_OF_STATUS_OF_PENDING_TX,
					})
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
			.subscribe({
				next: (statusOfTransaction) => {
					const { txID } = statusOfTransaction
					log.info(
						`Transaction with txID='${txID.toString()}' has completed succesfully.`,
					)
					track({
						value: statusOfTransaction,
						eventUpdateType: TransactionTrackingEventType.COMPLETED,
					})

					completionSubject.next(txID)
					completionSubject.complete()
				},
			})
			.add(subs)

		return {
			completion: completionSubject.asObservable(),
			events: trackingSubject.asObservable(),
		}
	}

	const __makeTransactionFromBuilder = (
		transactionIntentBuilderT: TransactionIntentBuilderT,
		options: MakeTransactionOptions,
	): TransactionTracking => {
		log.debug(`make transaction from builder`)
		const intent$ = transactionIntentBuilderT.build({
			encryptMessageIfAnyWithAccount: activeAccount,
		})
		return __makeTransactionFromIntent(intent$, options)
	}

	const transferTokens = (
		input: TransferTokensOptions,
	): TransactionTracking => {
		log.debug(`transferTokens`)
		return __makeTransactionFromBuilder(
			TransactionIntentBuilder.create().transferTokens(
				input.transferInput,
			),
			{ ...input },
		)
	}

	const stakeTokens = (input: StakeOptions) => {
		log.debug('stake')
		return __makeTransactionFromBuilder(
			TransactionIntentBuilder.create().stakeTokens(input.stakeInput),
			{ ...input },
		)
	}

	const unstakeTokens = (input: UnstakeOptions) => {
		log.debug('unstake')
		return __makeTransactionFromBuilder(
			TransactionIntentBuilder.create().unstakeTokens(input.unstakeInput),
			{ ...input },
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
				tap(({ status }) =>
					log.info(
						`Got transaction status ${status.toString()} for txID: ${txID.toString()}`,
					),
				),
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

		// Wallet APIs
		activeAddress,
		activeAccount,
		accounts,

		// Active Address/Account APIs
		tokenBalances,
		stakingPositions,
		unstakingPositions,

		// Methods
		transferTokens,
		transactionHistory,
		stakeTokens,
		unstakeTokens,
	}
}

export const Radix = {
	create,
}
