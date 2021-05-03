import {
	AccountAddressT,
	AccountsT,
	AccountT,
	DeriveNextAccountInput,
	MnemomicT,
	NetworkT,
	SwitchAccountInput,
	Wallet,
	WalletT,
} from '@radixdlt/account'
import { nodeAPI, NodeT, RadixAPI, radixCoreAPI, RadixCoreAPI } from './api'

import {
	catchError,
	distinctUntilChanged,
	filter,
	map,
	mergeMap,
	share,
	shareReplay,
	skipWhile,
	switchMap,
	take,
	tap,
	withLatestFrom,
} from 'rxjs/operators'
import {
	combineLatest,
	EMPTY,
	forkJoin,
	interval,
	merge,
	Observable,
	of,
	ReplaySubject,
	Subject,
	Subscription,
	throwError,
} from 'rxjs'
import { EncryptedMessage, KeystoreT } from '@radixdlt/crypto'
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
	lookupValidatorErr,
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
import { log, msgFromError, LogLevel } from '@radixdlt/util'
import {
	BuiltTransaction,
	ExecutedTransaction,
	FinalizedTransaction,
	flatMapAddressesOf,
	PendingTransaction,
	SignedTransaction,
	SimpleExecutedTransaction,
	SimpleTokenBalance,
	SimpleTokenBalances,
	SimpleTransactionHistory,
	singleRecipientFromActions,
	Token,
	TokenBalance,
	TokenBalances,
	TransactionHistory,
	TransactionHistoryActiveAccountRequestInput,
	TransactionIdentifierT,
	TransactionIntent,
	TransactionIntentBuilder,
	TransactionIntentBuilderOptions,
	TransactionIntentBuilderT,
	TransactionStateError,
	TransactionStateUpdate,
	TransactionStatus,
	TransactionTracking,
	TransactionTrackingEventType,
	TransactionType,
} from './dto'
import { ExecutedAction } from './actions'

const txTypeFromActions = (
	input: Readonly<{
		actions: ExecutedAction[]
		activeAddress: AccountAddressT
	}>,
): TransactionType => {
	const { activeAddress } = input
	const myAddress = activeAddress.toString()
	const fromUnique = flatMapAddressesOf({
		...input,
		includeTo: false,
	}).map((a) => a.toString())
	const toUnique = flatMapAddressesOf({
		...input,
		includeFrom: false,
	}).map((a) => a.toString())

	const toMe = toUnique.includes(myAddress)
	const fromMe = fromUnique.includes(myAddress)

	if (toMe && fromMe) {
		return TransactionType.FROM_ME_TO_ME
	} else if (toMe) {
		return TransactionType.INCOMING
	} else if (fromMe) {
		return TransactionType.OUTGOING
	} else {
		return TransactionType.UNRELATED
	}
}

const decorateSimpleExecutedTransactionWithType = (
	simpleExecutedTX: SimpleExecutedTransaction,
	activeAddress: AccountAddressT,
): ExecutedTransaction => ({
	...simpleExecutedTX,
	transactionType: txTypeFromActions({
		actions: simpleExecutedTX.actions,
		activeAddress,
	}),
})

const shouldConfirmTransactionAutomatically = (
	confirmationScheme: TransactionConfirmationBeforeFinalization,
): confirmationScheme is 'skip' => confirmationScheme === 'skip'

const create = (
	input?: Readonly<{
		network?: NetworkT
	}>,
): RadixT => {
	const requestedNetwork = input?.network ?? NetworkT.BETANET // TODO Mainnet replace with NetworkT.MAINNET when launched
	const subs = new Subscription()
	const radixLog = log // TODO configure child loggers

	const nodeSubject = new ReplaySubject<NodeT>()
	const coreAPISubject = new ReplaySubject<RadixCoreAPI>()
	const walletSubject = new ReplaySubject<WalletT>()
	const errorNotificationSubject = new Subject<ErrorNotification>()

	const deriveAccountSubject = new Subject<DeriveNextAccountInput>()
	const switchAccountSubject = new Subject<SwitchAccountInput>()

	const tokenBalanceFetchSubject = new ReplaySubject<number>(0)
	const stakingFetchSubject = new ReplaySubject<number>(0)
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
			take(1),
			// We do NOT omit/supress error, we merely DECORATE the error
			catchError((errors: unknown) => {
				const underlyingError = msgFromError(errors)
				throw errorFn(underlyingError)
			}),
		)

	const networkId: () => Observable<NetworkT> = fwdAPICall(
		(a) => {
			return (): Observable<NetworkT> => {
				return a.networkId()
			}
		},
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

		lookupValidator: fwdAPICall(
			(a) => a.lookupValidator,
			(m) => lookupValidatorErr(m),
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

	const lookupTransaction = (
		txID: TransactionIdentifierT,
	): Observable<ExecutedTransaction> =>
		api.lookupTransaction(txID).pipe(
			withLatestFrom(activeAddress),
			map(([simpleTx, aa]) =>
				decorateSimpleExecutedTransactionWithType(simpleTx, aa),
			),
		)

	const revealMnemonic = (): Observable<MnemomicT> =>
		wallet$.pipe(
			map(
				(wallet: WalletT): MnemomicT => {
					return wallet.revealMnemonic()
				},
			),
		)

	const activeAddressToAPIObservableWithTrigger = <O>(
		trigger: Observable<number>,
		pickFn: (
			api: RadixCoreAPI,
		) => (address: AccountAddressT) => Observable<O>,
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
		return api.tokenInfo(simpleTokenBalance.tokenIdentifier).pipe(
			map(
				(tokenInfo: Token): TokenBalance => ({
					amount: simpleTokenBalance.amount,
					token: tokenInfo,
				}),
			)
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

				return simpleTokenBalances.tokenBalances.length === 0
					? of({
							owner: simpleTokenBalances.owner,
							tokenBalances: [],
					  })
					: forkJoin(balanceOfTokensObservableList).pipe(
							map(
								(
									tokenBalances: TokenBalance[],
								): TokenBalances => {
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
	).pipe(
		map((positions) =>
			positions.filter((position) => position.epochsUntil > 0),
		),
	)

	const transactionHistory = (
		input: TransactionHistoryActiveAccountRequestInput,
	): Observable<TransactionHistory> => {
		return activeAddress.pipe(
			withLatestFrom(coreAPI$),
			switchMap(([activeAddress, api]) => {
				return api
					.transactionHistory({ ...input, address: activeAddress })
					.pipe(
						catchError((error: Error) => {
							errorNotificationSubject.next(
								transactionHistoryErr(error.message),
							)
							return EMPTY
						}),
						map(
							(
								simpleTxHistory: SimpleTransactionHistory,
							): TransactionHistory => {
								return {
									...simpleTxHistory,
									transactions: simpleTxHistory.transactions.map(
										(
											simpleExecutedTX: SimpleExecutedTransaction,
										): ExecutedTransaction =>
											decorateSimpleExecutedTransactionWithType(
												simpleExecutedTX,
												activeAddress,
											),
									),
								}
							},
						),
					)
			}),
			shareReplay(1),
		)
	}

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
		subs.add(
			node.subscribe(
				(n) => {
					radixLog.debug(`Using node ${n.url.toString()}`)
					nodeSubject.next(n)
				},
				(error: Error) => {
					errorNotificationSubject.next(getNodeErr(error.message))
				},
			),
		)
	}

	const _withWallet = (wallet: WalletT): void => {
		// Important! We must provide wallet with `networkId`,
		// so that it can derive addresses for its accounts.
		const networkID$ = networkId()
		wallet.provideNetworkId(networkID$)
		walletSubject.next(wallet)
	}

	const __makeTransactionFromIntent = (
		transactionIntent$: Observable<TransactionIntent>,
		options: MakeTransactionOptions,
	): TransactionTracking => {
		const txLog = radixLog // TODO configure child loggers

		txLog.info(
			`Start of transaction flow, inside constructor of 'TransactionTracking'.`,
		)

		const signUnsignedTx = (
			unsignedTx: BuiltTransaction,
		): Observable<SignedTransaction> => {
			txLog.info('Starting signing transaction (async).')
			return activeAccount.pipe(
				take(1), // IMPORTANT!!!
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
									txLog.info(`Finished signing transaction`)
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

		const pendingTXSubject = new Subject<PendingTransaction>()

		const askUserToConfirmSubject = new ReplaySubject<BuiltTransaction>()
		const userDidConfirmTransactionSubject = new ReplaySubject<0>()

		if (shouldConfirmTransactionAutomatically(options.userConfirmation)) {
			txLog.info(
				'Transaction has been setup to be automatically confirmed, requiring no final confirmation input from user.',
			)
			subs.add(
				askUserToConfirmSubject.subscribe(() => {
					txLog.debug(
						`askUserToConfirmSubject got 'next', calling 'next' on 'userDidConfirmTransactionSubject'`,
					)
					userDidConfirmTransactionSubject.next(0)
				}),
			)
		} else {
			txLog.info(
				`Transaction has been setup so that it requires a manual final confirmation from user before being finalized.`,
			)
			const twoWayConfirmationSubject: Subject<ManualUserConfirmTX> =
				options.userConfirmation

			subs.add(
				askUserToConfirmSubject.subscribe((ux) => {
					txLog.info(
						`Forwarding signedUnconfirmedTX and 'userDidConfirmTransactionSubject' to subject 'twoWayConfirmationSubject' now (inside subscribe to 'askUserToConfirmSubject')`,
					)

					const confirmation: ManualUserConfirmTX = {
						txToConfirm: ux,
						confirm: () => userDidConfirmTransactionSubject.next(0),
					}
					twoWayConfirmationSubject.next(confirmation)
				}),
			)
		}

		const trackingSubject = new ReplaySubject<TransactionStateUpdate>()

		const track = (event: TransactionStateUpdate): void => {
			trackingSubject.next(event)
		}

		const completionSubject = new Subject<TransactionIdentifierT>()

		const trackError = (
			input: Readonly<{
				error: Error
				inStep: TransactionTrackingEventType
			}>,
		): void => {
			const errorEvent: TransactionStateError = {
				eventUpdateType: input.inStep,
				error: input.error,
			}
			txLog.info(`Forwarding error to 'errorSubject'`)
			track(errorEvent)
			completionSubject.error(errorEvent.error)
		}

		const builtTransaction$ = transactionIntent$.pipe(
			switchMap(
				(intent: TransactionIntent): Observable<BuiltTransaction> => {
					txLog.debug(
						'Transaction intent created => requesting 🛰 API to build it now.',
					)
					track({
						transactionState: intent,
						eventUpdateType: TransactionTrackingEventType.INITIATED,
					})
					return api.buildTransaction(intent)
				},
			),
			catchError((e: Error) => {
				txLog.error(
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
				txLog.debug(
					'TX built by API => asking for confirmation to sign...',
				)
				track({
					transactionState: builtTx,
					eventUpdateType:
						TransactionTrackingEventType.BUILT_FROM_INTENT,
				})
				askUserToConfirmSubject.next(builtTx)
			}),
			tap((builtTx) => {
				track({
					transactionState: builtTx,
					eventUpdateType:
						TransactionTrackingEventType.ASKED_FOR_CONFIRMATION,
				})
			}),
		)

		const signedTransaction$ = combineLatest([
			builtTransaction$,
			userDidConfirmTransactionSubject,
		]).pipe(
			map(([signedTx, _]) => signedTx),
			tap((unsignedTx) => {
				track({
					transactionState: unsignedTx,
					eventUpdateType: TransactionTrackingEventType.CONFIRMED,
				})
			}),
			mergeMap((unsignedTx) => signUnsignedTx(unsignedTx)),
			shareReplay(1),
		)

		const finalizedTx$ = signedTransaction$.pipe(
			mergeMap(
				(
					signedTx: SignedTransaction,
				): Observable<FinalizedTransaction> => {
					txLog.debug(
						`Finished signing tx => submitting it to 🛰  API.`,
					)
					track({
						transactionState: signedTx,
						eventUpdateType: TransactionTrackingEventType.SIGNED,
					})
					return api.finalizeTransaction(signedTx)
				},
			),
			catchError((e: Error) => {
				txLog.error(
					`API failed to submit transaction, error: ${JSON.stringify(
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
				txLog.debug(
					`Received finalized transaction with txID='${finalizedTx.txID.toString()}' from API, calling submit.`,
				)
				track({
					transactionState: finalizedTx,
					eventUpdateType: TransactionTrackingEventType.FINALIZED,
				})
			}),
		)

		subs.add(
			combineLatest([finalizedTx$, signedTransaction$])
				.pipe(
					mergeMap(
						([
							finalizedTx,
							signedTx,
						]): Observable<PendingTransaction> => {
							return api.submitSignedTransaction({
								...finalizedTx,
								...signedTx,
							})
						},
					),
					catchError((e: Error) => {
						txLog.error(
							`API failed to submit transaction, error: ${JSON.stringify(
								e,
								null,
								4,
							)}`,
						)
						trackError({
							error: e,
							inStep: TransactionTrackingEventType.SUBMITTED,
						})
						return EMPTY
					}),
					tap({
						next: (pendingTx: PendingTransaction) => {
							txLog.debug(
								`Submitted transaction with txID='${pendingTx.txID.toString()}', it is now pending.`,
							)
							track({
								transactionState: pendingTx,
								eventUpdateType:
									TransactionTrackingEventType.SUBMITTED,
							})
							pendingTXSubject.next(pendingTx)
						},
						error: (submitTXError: Error) => {
							// TODO would be great to have access to txID here, hopefully API includes it in error msg?
							txLog.error(
								`Submission of signed transaction to API failed with error: ${submitTXError.message}`,
							)
							pendingTXSubject.error(submitTXError)
						},
					}),
				)
				.subscribe(),
		)

		const pollTxStatusTrigger = (
			options.pollTXStatusTrigger ?? interval(1000)
		).pipe(share())

		const transactionStatus$ = combineLatest([
			pollTxStatusTrigger,
			pendingTXSubject,
		]).pipe(
			mergeMap(([_, pendingTx]) => {
				txLog.debug(
					`Asking API for status of transaction with txID: ${pendingTx.txID.toString()}`,
				)
				return api.transactionStatus(pendingTx.txID)
			}),
			distinctUntilChanged((prev, cur) => prev.status === cur.status),
			share(),
		)

		const transactionCompletedWithStatusConfirmed$ = transactionStatus$.pipe(
			skipWhile(({ status }) => status !== TransactionStatus.CONFIRMED),
			take(1),
		)

		const transactionCompletedWithStatusFailed$ = transactionStatus$.pipe(
			skipWhile(({ status }) => status !== TransactionStatus.FAILED),
			take(1),
		)

		subs.add(
			transactionStatus$.subscribe({
				next: (statusOfTransaction) => {
					const { status, txID } = statusOfTransaction
					txLog.info(
						`Status ${status.toString()} of transaction with txID='${txID.toString()}'`,
					)
					track({
						transactionState: statusOfTransaction,
						eventUpdateType:
							TransactionTrackingEventType.UPDATE_OF_STATUS_OF_PENDING_TX,
					})
				},
				error: (transactionStatusError: Error) => {
					// TODO hmm how to get txID here?
					txLog.error(
						`Failed to get status of transaction, error: ${transactionStatusError.message}`,
					)
				},
			}),
		)

		subs.add(
			transactionCompletedWithStatusConfirmed$.subscribe({
				next: (statusOfTransaction) => {
					const { txID } = statusOfTransaction
					txLog.info(
						`Transaction with txID='${txID.toString()}' has completed succesfully.`,
					)
					track({
						transactionState: statusOfTransaction,
						eventUpdateType: TransactionTrackingEventType.COMPLETED,
					})

					completionSubject.next(txID)
					completionSubject.complete()
				},
			}),
		)

		subs.add(
			transactionCompletedWithStatusFailed$.subscribe((status) => {
				const errMsg = `API status of tx with id=${status.txID.toString()} returned 'FAILED'`
				txLog.error(errMsg)
				trackError({
					error: new Error(errMsg),
					inStep:
						TransactionTrackingEventType.UPDATE_OF_STATUS_OF_PENDING_TX,
				})
			}),
		)

		return {
			completion: completionSubject.asObservable(),
			events: trackingSubject.asObservable(),
		}
	}

	const __makeTransactionFromBuilder = (
		transactionIntentBuilderT: TransactionIntentBuilderT,
		makeTXOptions: MakeTransactionOptions,
		builderOptions?: TransactionIntentBuilderOptions,
	): TransactionTracking => {
		radixLog.debug(`make transaction from builder`)
		const intent$ = transactionIntentBuilderT.build(
			builderOptions ?? {
				skipEncryptionOfMessageIfAny: {
					spendingSender: activeAddress.pipe(take(1)),
				},
			},
		)
		return __makeTransactionFromIntent(intent$, makeTXOptions)
	}

	const transferTokens = (
		input: TransferTokensOptions,
	): TransactionTracking => {
		radixLog.debug(`transferTokens`)
		const builder = TransactionIntentBuilder.create().transferTokens(
			input.transferInput,
		)

		let encryptMsgIfAny = false
		if (input.message) {
			builder.message(input.message)
			encryptMsgIfAny = input.message.encrypt
		}

		return __makeTransactionFromBuilder(
			builder,
			{ ...input },
			encryptMsgIfAny
				? {
						encryptMessageIfAnyWithAccount: activeAccount.pipe(
							take(1),
						),
				  }
				: undefined,
		)
	}

	const stakeTokens = (input: StakeOptions) => {
		radixLog.debug('stake')
		return __makeTransactionFromBuilder(
			TransactionIntentBuilder.create().stakeTokens(input.stakeInput),
			{ ...input },
		)
	}

	const unstakeTokens = (input: UnstakeOptions) => {
		radixLog.debug('unstake')
		return __makeTransactionFromBuilder(
			TransactionIntentBuilder.create().unstakeTokens(input.unstakeInput),
			{ ...input },
		)
	}

	const decryptTransaction = (
		input: SimpleExecutedTransaction,
	): Observable<string> => {
		radixLog.info(
			`Trying to decrypt transaction with txID=${input.txID.toString()}`,
		)

		if (!input.message) {
			const noMsg = `TX contains no message, nothing to decrypt (txID=${input.txID.toString()}).`
			radixLog.info(noMsg)
			return throwError(() => new Error(noMsg))
		}

		const messageBuffer = Buffer.from(input.message, 'hex')

		const encryptedMessageResult = EncryptedMessage.fromBuffer(
			messageBuffer,
		)

		if (!encryptedMessageResult.isOk()) {
			const errMessage = `Failed to parse message as 'EncryptedMessage' type, underlying error: '${msgFromError(
				encryptedMessageResult.error,
			)}'. Might not have been encrypted? Try decode string as UTF-8 string.`
			log.warn(errMessage)
			return throwError(new Error(errMessage))
		}

		const encryptedMessage = encryptedMessageResult.value

		return activeAccount.pipe(
			take(1),
			mergeMap((account) => {
				return account.derivePublicKey().pipe(
					mergeMap((myPublicKey) => {
						log.info(
							`Trying to decrypt message with activeAccount with pubKey=${myPublicKey.toString()}`,
						)
						const publicKeyOfOtherPartyResult = singleRecipientFromActions(
							myPublicKey,
							input.actions,
						)
						if (!publicKeyOfOtherPartyResult.isOk()) {
							return throwError(
								new Error(
									msgFromError(
										publicKeyOfOtherPartyResult.error,
									),
								),
							)
						}
						log.info(
							`Trying to decrypt message with publicKeyOfOtherPartyResult=${publicKeyOfOtherPartyResult.toString()}`,
						)

						return account.decrypt({
							encryptedMessage,
							publicKeyOfOtherParty:
								publicKeyOfOtherPartyResult.value,
						})
					}),
				)
			}),
			take(1),
		)
	}

	const restoreAccountsUpToIndex = (index: number): Observable<AccountsT> => {
		return wallet$.pipe(mergeMap((w) => w.restoreAccountsUpToIndex(index)))
	}

	subs.add(
		deriveAccountSubject
			.pipe(
				withLatestFrom(wallet$),
				tap(([derivation, w]) => w.deriveNext(derivation)),
			)
			.subscribe(),
	)

	subs.add(
		switchAccountSubject
			.pipe(
				withLatestFrom(wallet$),
				tap(([switchTo, w]) => w.switchAccount(switchTo)),
			)
			.subscribe(),
	)

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
			subs.add(radixCoreAPI$.subscribe((a) => coreAPISubject.next(a)))
			return this
		},

		connect: function (url: string): RadixT {
			_withNode(of({ url: new URL(url) }))
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

		restoreAccountsUpToIndex,

		decryptTransaction: decryptTransaction,

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
					radixLog.info(
						`Got transaction status ${status.toString()} for txID: ${txID.toString()}`,
					),
				),
			)
		},

		withTokenBalanceFetchTrigger: function (trigger: Observable<number>) {
			subs.add(trigger.subscribe(tokenBalanceFetchSubject))
			return this
		},

		withStakingFetchTrigger: function (trigger: Observable<number>) {
			subs.add(trigger.subscribe(stakingFetchSubject))
			return this
		},

		// Wallet APIs
		revealMnemonic,
		activeAddress,
		activeAccount,
		accounts,

		// Active AccountAddress/Account APIs
		tokenBalances,
		stakingPositions,
		unstakingPositions,

		// Methods
		lookupTransaction,
		transactionHistory,
		transferTokens,
		stakeTokens,
		unstakeTokens,
	}
}

export const Radix = {
	create,
}
