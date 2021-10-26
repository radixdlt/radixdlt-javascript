import {
	AccountAddressT,
	AddressOrUnsafeInput,
	DeriveHWSigningKeyInput,
	DeriveNextInput,
	ResourceIdentifierOrUnsafeInput,
	SigningKeychain,
	SigningKeychainT,
	isPrimitive
} from '@radixdlt/account'
import { AmountOrUnsafeInput, AmountT, Network } from '@radixdlt/primitives'
import { nodeAPI, RadixAPI, radixAPI } from './api'

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
	firstValueFrom,
	forkJoin,
	from,
	interval,
	lastValueFrom,
	merge,
	Observable,
	of,
	ReplaySubject,
	Subject,
	Subscription,
	throwError,
} from 'rxjs'
import { KeystoreT, Message, MnemomicT } from '@radixdlt/crypto'
import {
	AddAccountByPrivateKeyInput,
	AccountsT,
	WalletT,
	AccountT,
	MakeTransactionOptions,
	ManualUserConfirmTX,
	StakeOptions,
	SwitchAccountInput,
	TransactionConfirmationBeforeFinalization,
	TransferTokensOptions,
	UnstakeOptions,
	RadixT,
	MessageInTransaction,
} from './_types'
import {
	APIError,
	APIErrorObject,
	buildTxFromIntentErr,
	ErrorT,
	finalizeTxErr,
	lookupTxErr,
	lookupValidatorErr,
	nativeTokenErr,
	networkIdErr,
	NetworkTxDemandErr,
	NetworkTxThroughputErr,
	nodeError,
	stakesForAddressErr,
	submitSignedTxErr,
	tokenBalancesErr,
	tokenInfoErr,
	transactionHistoryErr,
	txStatusErr,
	unstakesForAddressErr,
	validatorsErr,
	walletError,
} from './errors'
import { log, LogLevel, msgFromError, isArray, toObservable, toObservableFromResult } from '@radixdlt/util'
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
	Token,
	TokenBalance,
	TokenBalances,
	TransactionHistory,
	TransactionHistoryActiveAccountRequestInput,
	TransactionIdentifierT,
	TransactionIntent,
	TransactionIntentBuilderOptions,
	TransactionIntentBuilderT,
	TransactionStateError,
	TransactionStateUpdate,
	TransactionStatus,
	TransactionTracking,
	TransactionTrackingEventType,
	TransactionType,
} from './dto'
import { ActionType, ExecutedAction, TransferTokensAction } from './actions'
import { Wallet } from './wallet'
import { pipe } from 'ramda'
import { buildTransaction, createTransfer, Action } from './dto/build-transaction'
import { err, ok, Result, ResultAsync } from 'neverthrow'
import { ResourceIdentifierT } from 'packages/account/src/addresses'

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
	}).map(a => a.toString())
	const toUnique = flatMapAddressesOf({
		...input,
		includeFrom: false,
	}).map(a => a.toString())

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

const create = () => {
	const subs = new Subscription()
	const radixLog = log // TODO configure child loggers

	const nodeSubject = new ReplaySubject<URL>()
	const radixAPISubject = new ReplaySubject<RadixAPI>()
	const walletSubject = new ReplaySubject<WalletT>()
	const errorNotificationSubject = new Subject<ErrorT<any>>()

	const deriveNextLocalHDAccountSubject = new Subject<DeriveNextInput>()
	const addAccountByPrivateKeySubject = new Subject<AddAccountByPrivateKeyInput>()
	const switchAccountSubject = new Subject<SwitchAccountInput>()

	const tokenBalanceFetchSubject = new Subject<number>()
	const stakingFetchSubject = new Subject<number>()
	const wallet$ = walletSubject.asObservable()

	const networkSubject = new ReplaySubject<Network>()

	let walletSubscription: Subscription

	const coreAPIViaNode$ = nodeSubject
		.asObservable()
		.pipe(map(url => radixAPI(nodeAPI(url))))

	const coreAPI$ = merge(coreAPIViaNode$, radixAPISubject.asObservable()).pipe(
		shareReplay(1),
	)

	const activeAddress = wallet$.pipe(
		mergeMap(a => a.observeActiveAccount()),
		map(a => a.address),
		shareReplay(1),
	)

	/*
	const lookupTransaction = (
		txID: TransactionIdentifierT,
	): Observable<ExecutedTransaction> =>
		coreAPI$.pipe(
			map(
				api => {
					api.lookupTransaction(txID).pipe(
						withLatestFrom(activeAddress),
						map(([simpleTx, aa]) =>
							decorateSimpleExecutedTransactionWithType(simpleTx, aa),
						),
					)
				}
			)
		)
*/
	const revealMnemonic = (): Observable<MnemomicT> =>
		wallet$.pipe(
			map((wallet: WalletT): MnemomicT => wallet.revealMnemonic()),
		)

	const activeAddressToAPIObservableWithTrigger = <O>(
		trigger: Observable<number>,
		pickFn: (
			api: RadixAPI,
		) => (address: AccountAddressT) => Observable<O>,
		errorFn: (error: APIErrorObject) => APIError,
	): Observable<O> =>
		merge(
			trigger.pipe(
				withLatestFrom(activeAddress),
				map(result => result[1]),
			),
			activeAddress,
		).pipe(
			withLatestFrom(coreAPI$),
			switchMap(([address, api]) =>
				pickFn(api)(address).pipe(
					catchError(error => {
						console.error(error)
						errorNotificationSubject.next(errorFn(error))
						return EMPTY
					}),
				),
			),
			shareReplay(1),
		)
	/*
const simpleTokenBalances = activeAddressToAPIObservableWithTrigger(
tokenBalanceFetchSubject,
a => a.tokenBalancesForAddress,
tokenBalancesErr,
)

const decorateSimpleTokenBalanceWithTokenInfo = (
simpleTokenBalance: SimpleTokenBalance,
): Observable<TokenBalance> =>
api.tokenInfo(simpleTokenBalance.tokenIdentifier).pipe(
map(
(tokenInfo: Token): TokenBalance => ({
	amount: simpleTokenBalance.amount,
	token: tokenInfo,
}),
),
)

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
			): TokenBalances => ({
				owner: simpleTokenBalances.owner,
				tokenBalances,
			}),
		),
	)
},
),
)

const stakingPositions = activeAddressToAPIObservableWithTrigger(
stakingFetchSubject,
a => a.stakesForAddress,
stakesForAddressErr,
)

const unstakingPositions = activeAddressToAPIObservableWithTrigger(
stakingFetchSubject,
a => a.unstakesForAddress,
unstakesForAddressErr,
)

const transactionHistory = (
input: TransactionHistoryActiveAccountRequestInput,
): Observable<TransactionHistory> =>
activeAddress.pipe(
take(1),
switchMap(activeAddress =>
api
	.transactionHistory({ ...input, address: activeAddress })
	.pipe(
		map(
			(
				simpleTxHistory: SimpleTransactionHistory,
			): TransactionHistory => ({
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
			}),
		),
	),
),
)
*/

	const activeAccount: Observable<AccountT> = wallet$.pipe(
		mergeMap(wallet => wallet.observeActiveAccount()),
		shareReplay(1),
		distinctUntilChanged((prev, cur) => prev.equals(cur)),
	)

	const accounts = wallet$.pipe(
		mergeMap(wallet => wallet.observeAccounts()),
		shareReplay(1),
	)
	
	const __makeTransactionFromIntent = (
		transactionIntent$: Observable<TransactionIntent>,
		options: MakeTransactionOptions,
	): TransactionTracking => {
		const txLog = radixLog // TODO configure child loggers
		const txSubs = new Subscription()

		txLog.debug(
			`Start of transaction flow, inside constructor of 'TransactionTracking'.`,
		)

		const signUnsignedTx = (
			unsignedTx: BuiltTransaction,
		): Observable<SignedTransaction> => {
			txLog.debug('Starting signing transaction (async).')
			return combineLatest(
				transactionIntent$,
				activeAccount.pipe(take(1)),
			).pipe(
				mergeMap(
					([
						transactionIntent,
						account,
					]): Observable<SignedTransaction> => {
						const nonXRDHRPsOfRRIsInTx: string[] = transactionIntent.actions
							.filter(a => a.type === ActionType.TRANSFER)
							.map(a => a as Action.Transfer)
							.filter(t => t.rri.name !== 'xrd')
							.map(t => t.rri.name)

						const uniquenonXRDHRPsOfRRIsInTx = [
							...new Set(nonXRDHRPsOfRRIsInTx),
						]

						if (uniquenonXRDHRPsOfRRIsInTx.length > 1) {
							const errMsg = `Error cannot sign transction with multiple non-XRD RRIs. Unsupported by Ledger app.`
							log.error(errMsg)
							return throwError(new Error(errMsg))
						}

						const nonXRDHrp =
							uniquenonXRDHRPsOfRRIsInTx.length === 1
								? uniquenonXRDHRPsOfRRIsInTx[0]
								: undefined

						return account
							.sign(unsignedTx.transaction, nonXRDHrp)
							.pipe(
								map(
									(signature): SignedTransaction => {
										const publicKeyOfSigner =
											account.publicKey
										txLog.debug(
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

		const pendingTXSubject = new Subject<PendingTransaction>()

		const askUserToConfirmSubject = new ReplaySubject<BuiltTransaction>()
		const userDidConfirmTransactionSubject = new ReplaySubject<0>()

		if (shouldConfirmTransactionAutomatically(options.userConfirmation)) {
			txLog.debug(
				'Transaction has been setup to be automatically confirmed, requiring no final confirmation input from user.',
			)
			txSubs.add(
				askUserToConfirmSubject.subscribe(() => {
					txLog.debug(
						`askUserToConfirmSubject got 'next', calling 'next' on 'userDidConfirmTransactionSubject'`,
					)
					userDidConfirmTransactionSubject.next(0)
				}),
			)
		} else {
			txLog.debug(
				`Transaction has been setup so that it requires a manual final confirmation from user before being finalized.`,
			)
			const twoWayConfirmationSubject: Subject<ManualUserConfirmTX> =
				options.userConfirmation

			txSubs.add(
				askUserToConfirmSubject.subscribe(ux => {
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
			txLog.debug(`Forwarding error to 'errorSubject'`)
			track(errorEvent)
			completionSubject.error(errorEvent.error)
		}

		const builtTransaction$ = transactionIntent$.pipe(
			withLatestFrom(activeAddress),
			switchMap(
				([intent, address]) => {
					txLog.debug(
						'Transaction intent created => requesting 🛰 API to build it now.',
					)
					track({
						transactionState: intent,
						eventUpdateType: TransactionTrackingEventType.INITIATED,
					})

					const builtTx = api().then(api => api.buildTransaction({ ...intent, from: address }))
					return from(builtTx)
				},
			),
			// @ts-ignore
			mergeMap((x): Observable<BuiltTransaction> => toObservableFromResult<BuiltTransaction, Error[]>(x)),
			catchError((e: Error) => {
				
				//txLog.error(
				//	`API failed to build transaction, error: ${e}`,
				//)
				trackError({
					error: e,
					inStep: TransactionTrackingEventType.BUILT_FROM_INTENT,
				})
				return EMPTY
			}),
			tap(builtTx => {
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
			tap(builtTx => {
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
			tap(unsignedTx => {
				track({
					transactionState: unsignedTx,
					eventUpdateType: TransactionTrackingEventType.CONFIRMED,
				})
			}),
			mergeMap(unsignedTx => signUnsignedTx(unsignedTx)),
			shareReplay(1),
		)

		const finalizedTx$ = signedTransaction$.pipe(
			mergeMap(
				(
					signedTx: SignedTransaction,
				) => {
					txLog.debug(
						`Finished signing tx => submitting it to 🛰  API.`,
					)
					track({
						transactionState: signedTx,
						eventUpdateType: TransactionTrackingEventType.SIGNED,
					})
					const finalizedTx = api().then(api => api.finalizeTransaction(signedTx))
					return finalizedTx
				},
			),
			// @ts-ignore
			mergeMap(x => toObservableFromResult(x)),
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
			tap<FinalizedTransaction>(finalizedTx => {
				txLog.debug(
					`Received finalized transaction with txID='${finalizedTx.txID.toPrimitive()}' from API, calling submit.`,
				)
				track({
					transactionState: finalizedTx,
					eventUpdateType: TransactionTrackingEventType.FINALIZED,
				})
			}),
		)

		txSubs.add(
			finalizedTx$
				.pipe(
					mergeMap(
						(finalizedTx) => {
							const pendingTx = api().then(api => api.submitSignedTransaction(finalizedTx))
							return pendingTx
						}
					),
					// @ts-ignore
					mergeMap(x => toObservableFromResult(x)),
					tap({
						next: (pendingTx: PendingTransaction) => {
							txLog.debug(
								`Submitted transaction with txID='${pendingTx.txID.toPrimitive()}', it is now pending.`,
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
					`Asking API for status of transaction with txID: ${pendingTx.txID.toPrimitive()}`,
				)
				return api().then(api => api.transactionStatus({ txID: pendingTx.txID }))
			}),
			distinctUntilChanged((prev, cur) => prev._unsafeUnwrap().status === cur._unsafeUnwrap().status),
			share(),
		)

		const transactionCompletedWithStatusConfirmed$ = transactionStatus$.pipe(
			skipWhile(txID => txID._unsafeUnwrap().status !== TransactionStatus.CONFIRMED),
			take(1),
		)

		const transactionCompletedWithStatusFailed$ = transactionStatus$.pipe(
			skipWhile(txID => txID._unsafeUnwrap().status !== TransactionStatus.FAILED),
			take(1),
		)

		txSubs.add(
			transactionStatus$.subscribe({
				next: statusOfTransaction => {
					const { status, txID } = statusOfTransaction._unsafeUnwrap()
					txLog.debug(
						`Status ${status.toString()} of transaction with txID='${txID.toString()}'`,
					)
					track({
						transactionState: statusOfTransaction._unsafeUnwrap(),
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

		txSubs.add(
			transactionCompletedWithStatusConfirmed$.subscribe({
				next: statusOfTransaction => {
					const { txID } = statusOfTransaction._unsafeUnwrap()
					txLog.info(
						`Transaction with txID='${txID.toString()}' has completed succesfully.`,
					)
					track({
						transactionState: statusOfTransaction._unsafeUnwrap(),
						eventUpdateType: TransactionTrackingEventType.COMPLETED,
					})

					completionSubject.next(txID)
					completionSubject.complete()
					txSubs.unsubscribe()
				},
			}),
		)

		txSubs.add(
			transactionCompletedWithStatusFailed$.subscribe(status => {
				const errMsg = `API status of tx with id=${status._unsafeUnwrap().txID.toString()} returned 'FAILED'`
				txLog.error(errMsg)
				trackError({
					error: new Error(errMsg),
					inStep:
						TransactionTrackingEventType.UPDATE_OF_STATUS_OF_PENDING_TX,
				})
				txSubs.unsubscribe()
			}),
		)

		return {
			completion: completionSubject.asObservable(),
			events: trackingSubject.asObservable(),
		}
	}

	/*

	const __makeTransactionFromBuilder = (
		transactionIntentBuilderT: TransactionIntentBuilderT,
		makeTXOptions: MakeTransactionOptions,
		builderOptions?: TransactionIntentBuilderOptions,
	): TransactionTracking => {
		radixLog.debug(`make transaction from builder`)
		const intent$ = transactionIntentBuilderT.build(
			builderOptions ?? {
				skipEncryptionOfMessageIfAny: {
					spendingSender: activeAddress.pipe(take(1)), // IMPORTANT !
				},
			},
		)
		return __makeTransactionFromIntent(intent$, makeTXOptions)
	}

	*/
	const transferTokens = async (
		to: AccountAddressT,
		amount: AmountT,
		tokenIdentifier: ResourceIdentifierT,
		message?: MessageInTransaction,
		options: MakeTransactionOptions = { userConfirmation: 'skip' }
	): Promise<Result<TransactionTracking, Error[]>> => {
		const account = await firstValueFrom(activeAccount)

		const transferResult = createTransfer({
			from: account.address.toPrimitive(),
			to: to.toPrimitive(),
			amount: amount.toString(),
			rri: tokenIdentifier.toPrimitive()
		})

		if (transferResult.isErr()) return err(transferResult.error)

		const actionsResult = buildTransaction(transferResult.value)(account, message)

		if (actionsResult.isErr()) return err(actionsResult.error)

		return ok(__makeTransactionFromIntent(from(actionsResult.value), options))
	}
	/*

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
		radixLog.debug(
			`Trying to decrypt transaction with txID=${input.txID.toString()}`,
		)

		if (!input.message) {
			const noMsg = `TX contains no message, nothing to decrypt (txID=${input.txID.toString()}).`
			radixLog.info(noMsg)
			return throwError(() => new Error(noMsg))
		}

		const messageBuffer = Buffer.from(input.message, 'hex')

		const encryptedMessageResult = Message.fromBuffer(messageBuffer)

		if (!encryptedMessageResult.isOk()) {
			const errMessage = `Failed to parse message as 'EncryptedMessage' type, underlying error: '${msgFromError(
				encryptedMessageResult.error,
			)}'. Might not have been encrypted? Try decode string as UTF-8 string.`
			log.warn(errMessage)
			return throwError(new Error(errMessage))
		}

		const encryptedMessage = encryptedMessageResult.value

		if (encryptedMessage.kind !== 'ENCRYPTED')
			return of(encryptedMessage.plaintext)

		return activeAccount.pipe(
			take(1),
			mergeMap((account: AccountT) => {
				const myPublicKey = account.publicKey
				log.debug(
					`Trying to decrypt message with activeSigningKey with pubKey=${myPublicKey.toString()}`,
				)
				const publicKeyOfOtherPartyResult = singleRecipientFromActions(
					myPublicKey,
					input.actions,
				)
				if (!publicKeyOfOtherPartyResult.isOk()) {
					return throwError(
						new Error(
							msgFromError(publicKeyOfOtherPartyResult.error),
						),
					)
				}
				log.debug(
					`Trying to decrypt message with publicKeyOfOtherPartyResult=${publicKeyOfOtherPartyResult.toString()}`,
				)

				return account.decrypt({
					encryptedMessage,
					publicKeyOfOtherParty: publicKeyOfOtherPartyResult.value,
				})
			}),
			take(1),
		)
	}
*/
	const restoreLocalHDAccountsToIndex = (
		index: number,
	): Observable<AccountsT> =>
		wallet$.pipe(
			mergeMap(wallet => wallet.restoreLocalHDAccountsToIndex(index)),
		)

	subs.add(
		deriveNextLocalHDAccountSubject
			.pipe(
				withLatestFrom(wallet$),
				mergeMap(([derivation, wallet]) =>
					wallet.deriveNextLocalHDAccount(derivation),
				),
			)
			.subscribe(),
	)

	subs.add(
		addAccountByPrivateKeySubject
			.pipe(
				withLatestFrom(wallet$),
				mergeMap(([privateKeyInput, wallet]) =>
					wallet.addAccountFromPrivateKey(privateKeyInput),
				),
			)
			.subscribe(),
	)

	subs.add(
		switchAccountSubject
			.pipe(
				withLatestFrom(wallet$),
				tap(([switchTo, wallet]) => wallet.switchAccount(switchTo)),
			)
			.subscribe(),
	)

	const api = async () => await firstValueFrom(coreAPI$)

	const getAPICall = <
		Method extends keyof ReturnType<typeof radixAPI>,
		Args extends Parameters<RadixAPI[Method]>
		// @ts-ignore
	>(method: Method) => async (...args: Args) => await (await api())[method](...args)

	const methods = {
		api,

		__wallet: wallet$,

		__reset: () => subs.unsubscribe(),

		__withNodeConnection: (url$: Observable<URL>) => {
			subs.add(
				url$.subscribe(
					url => {
						radixLog.debug(`Using node ${url.toString()}`)
						nodeSubject.next(url)
					},
					(error: Error) => {
						errorNotificationSubject.next(nodeError(error))
					},
				),
			)
			return methods
		},

		__withAPI: (RadixAPI$: Observable<RadixAPI>) => {
			subs.add(RadixAPI$.subscribe(a => radixAPISubject.next(a)))
			return methods
		},

		__withWallet: (wallet: WalletT) => {
			walletSubject.next(wallet)
			return methods
		},

		__withKeychain: (signingKeychain: SigningKeychainT) => {
			firstValueFrom(networkSubject).then(network => {
				const wallet = Wallet.create({
					signingKeychain,
					network,
				})
				methods.__withWallet(wallet)
			})
			return methods
		},

		connect: async (url: string) => {
			methods.__withNodeConnection(of(new URL(url)))
			const result = await (await api()).networkId()

			if (result.isErr()) throw result.error

			networkSubject.next(result.value.networkId)
		},

		login: (password: string, loadKeystore: () => Promise<KeystoreT>) => {
			walletSubscription?.unsubscribe()

			void SigningKeychain.byLoadingAndDecryptingKeystore({
				password,
				load: loadKeystore,
			}).then(signingKeychainResult => {
				signingKeychainResult.match(
					(signingKeychain: SigningKeychainT) => {
						walletSubscription = networkSubject.subscribe(
							network => {
								const wallet = Wallet.create({
									signingKeychain,
									network,
								})
								methods.__withWallet(wallet)
							},
						)
					},
					error => {
						errorNotificationSubject.next(walletError(error))
					},
				)
			})

			return methods
		},

		errors: errorNotificationSubject.asObservable(),

		deriveNextAccount: (input?: DeriveNextInput) => {
			const derivation: DeriveNextInput = input ?? {}
			deriveNextLocalHDAccountSubject.next(derivation)
			return methods
		},

		deriveHWAccount: (
			input: DeriveHWSigningKeyInput,
		): Observable<AccountT> =>
			wallet$.pipe(mergeMap(wallet => wallet.deriveHWAccount(input))),

		displayAddressForActiveHWAccountOnHWDeviceForVerification: (): Observable<void> =>
			wallet$.pipe(
				mergeMap(wallet =>
					wallet.displayAddressForActiveHWAccountOnHWDeviceForVerification(),
				),
			),

		addAccountFromPrivateKey: (input: AddAccountByPrivateKeyInput) => {
			addAccountByPrivateKeySubject.next(input)
			return methods
		},

		switchAccount: (input: SwitchAccountInput) => {
			switchAccountSubject.next(input)
			return methods
		},

		restoreLocalHDAccountsToIndex,

		// decryptTransaction: decryptTransaction,

		logLevel: (level: LogLevel) => {
			log.setLevel(level)
			return methods
		},
		
		/*
		transactionStatus: (
			txID: TransactionIdentifierT,
			trigger: Observable<number>,
		) =>
			trigger.pipe(
				mergeMap(_ => api.transactionStatus(txID)),
				distinctUntilChanged((prev, cur) => prev.status === cur.status),
				filter(({ txID }) => txID.equals(txID)),
				tap(({ status }) =>
					radixLog.info(
						`Got transaction status ${status.toString()} for txID: ${txID.toString()}`,
					),
				),
			),
						*/
		withTokenBalanceFetchTrigger: (trigger: Observable<number>) => {
			subs.add(trigger.subscribe(tokenBalanceFetchSubject))
			return methods
		},

		withStakingFetchTrigger: (trigger: Observable<number>) => {
			subs.add(trigger.subscribe(stakingFetchSubject))
			return methods
		},

		// Wallet APIs
		revealMnemonic,
		activeAddress,
		activeAccount,
		accounts,
		// Active AccountAddress/Account APIs
		/*
		tokenBalances,
		stakingPositions,
		unstakingPositions,

		// Methods
		lookupTransaction,
		transactionHistory,
		*/
		transferTokens,
		/*
		stakeTokens,
		unstakeTokens,
		*/
		validators: getAPICall('validators'),
		lookupValidator: getAPICall('lookupValidator')
	}

	return methods
}

export const Radix = {
	create,
}
