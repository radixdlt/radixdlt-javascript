import {
	AccountAddressT,
	DeriveHWSigningKeyInput,
	DeriveNextInput,
	SigningKeychain,
	SigningKeychainT,
} from '@account'
import { AmountT, Network } from '@primitives'
import * as fromApi from './api'

import {
	distinctUntilChanged,
	filter,
	map,
	mergeMap,
	shareReplay,
	take,
	tap,
	withLatestFrom,
} from 'rxjs/operators'
import {
	firstValueFrom,
	from,
	merge,
	Observable,
	of,
	ReplaySubject,
	Subject,
	Subscription,
	throwError,
} from 'rxjs'
import { KeystoreT, Message, MnemomicT } from '@crypto'
import {
	AddAccountByPrivateKeyInput,
	AccountsT,
	WalletT,
	AccountT,
	MakeTransactionOptions,
	SwitchAccountInput,
	TxMessage,
} from './_types'
import { log, LogLevel, msgFromError } from '@util'
import {
	ExecutedTransaction,
	flatMapAddressesOf,
	SimpleExecutedTransaction,
	TransactionHistory,
	TransactionIdentifierT,
	TransactionType,
} from './dto'
import { ExecutedAction } from './actions'
import { Wallet } from './wallet'
import { andThen, pipe } from 'ramda'
import {
	buildTransaction,
	createTransfer,
	createStake,
	createUnstake,
} from './dto/buildTransaction'
import { Result, ResultAsync } from 'neverthrow'
import { ResourceIdentifierT, ValidatorAddressT } from '@account'
import { getRecipients } from './dto'
import { sendTransaction } from './transaction/sendTransaction'
import { SendTxOutput } from './transaction/_types'

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

const create = () => {
	const subs = new Subscription()
	const radixLog = log // TODO configure child loggers

	const nodeURLSubject = new ReplaySubject<URL>()
	const radixAPISubject = new ReplaySubject<fromApi.RadixAPI>()
	const walletSubject = new ReplaySubject<WalletT>()
	const xrdRRISubject = new ReplaySubject<ResourceIdentifierT>()
	const deriveNextLocalHDAccountSubject = new Subject<DeriveNextInput>()
	const addAccountByPrivateKeySubject =
		new Subject<AddAccountByPrivateKeyInput>()
	const switchAccountSubject = new Subject<SwitchAccountInput>()

	const wallet$ = walletSubject.asObservable()
	const xrdRRI$ = xrdRRISubject.asObservable()

	const networkSubject = new ReplaySubject<Network>()
	let walletSubscription: Subscription

	const radixAPIViaNode$ = nodeURLSubject
		.asObservable()
		.pipe(map(url => fromApi.radixAPI(fromApi.gatewayAPI(url))))

	const radixAPI$ = merge(
		radixAPIViaNode$,
		radixAPISubject.asObservable(),
	).pipe(shareReplay(1))

	const activeAddress = wallet$.pipe(
		mergeMap(a => a.observeActiveAccount()),
		map(a => a.address),
		shareReplay(1),
	)

	const revealMnemonic = (): Observable<MnemomicT> =>
		wallet$.pipe(
			map((wallet: WalletT): MnemomicT => wallet.revealMnemonic()),
		)

	const transactionHistory = async (
		size: number,
		cursor?: string,
	): Promise<Result<TransactionHistory, Error[]>> => {
		const address = await firstValueFrom(activeAddress)

		return (await radixAPI())
			.transactionHistory({ address, size, cursor })
			.map(txHistory => ({
				...txHistory,
				transactions: txHistory.transactions.map(
					(transaction): ExecutedTransaction =>
						decorateSimpleExecutedTransactionWithType(
							transaction,
							address,
						),
				),
			}))
	}

	const activeAccount: Observable<AccountT> = wallet$.pipe(
		mergeMap(wallet => wallet.observeActiveAccount()),
		shareReplay(1),
		distinctUntilChanged((prev, cur) => prev.equals(cur)),
	)

	const accounts = wallet$.pipe(
		mergeMap(wallet => wallet.observeAccounts()),
		shareReplay(1),
	)

	const decryptTransaction = (
		input: SimpleExecutedTransaction,
	): Observable<string> => {
		if (!input.message) {
			const noMsg = `TX contains no message, nothing to decrypt (txID=${input.txID.toString()}).`
			radixLog.info(noMsg)
			return throwError(() => new Error(noMsg))
		}

		const messageBuffer = Buffer.from(input.message?.raw, 'hex')

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

				const recipients = getRecipients(input.actions).filter(
					recipient => !recipient.equals(account.address),
				)

				if (recipients.length != 1)
					return throwError(() =>
						Error(
							'Failed to decrypt message. Multiple recipients.',
						),
					)

				const publicKeyOfOtherParty = recipients[0].publicKey

				return account.decrypt({
					encryptedMessage,
					publicKeyOfOtherParty,
				})
			}),
			take(1),
		)
	}

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

	subs.add(
		networkSubject
			.pipe(
				mergeMap(network => {
					log.debug(`fetching native token for network: ${network}`)
					return radixAPI$.pipe(
						map(api =>
							api
								.nativeToken({
									network_identifier: { network },
								})
								.map(token => {
									xrdRRISubject.next(token.rri)
								}),
						),
					)
				}),
			)
			.subscribe(),
	)

	const radixAPI = async () => firstValueFrom(radixAPI$)

	const getAPICall =
		<
			Method extends keyof ReturnType<typeof fromApi.radixAPI>,
			Args extends Parameters<fromApi.RadixAPI[Method]>,
		>(
			method: Method,
		) =>
		async (...args: Args): Promise<ReturnType<fromApi.RadixAPI[Method]>> =>
			// @ts-ignore
			(await radixAPI())[method](...args)

	const methods = {
		api: radixAPI,

		__wallet: wallet$,

		__reset: () => subs.unsubscribe(),

		__withNodeConnection: (url$: Observable<URL>) => {
			subs.add(
				url$.subscribe({
					next: url => {
						radixLog.debug(`Using node ${url.toString()}`)
						nodeURLSubject.next(url)
					},
				}),
			)
			return methods
		},

		__withAPI: (RadixAPI$: Observable<fromApi.RadixAPI>) => {
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
			const result = await (await radixAPI()).networkId()

			if (result.isErr()) throw result.error

			networkSubject.next(result.value.network)
		},

		withKeystore: async (keystore: KeystoreT, password: string) =>
			SigningKeychain.byLoadingAndDecryptingKeystore({
				password,
				load: async () => keystore,
			}).map(signingKeychain => {
				walletSubscription?.unsubscribe()

				walletSubscription = networkSubject.subscribe(network => {
					const wallet = Wallet.create({
						signingKeychain,
						network,
					})
					methods.__withWallet(wallet)
				})
			}),

		login: (password: string, loadKeystore: () => Promise<KeystoreT>) => {
			walletSubscription?.unsubscribe()

			void SigningKeychain.byLoadingAndDecryptingKeystore({
				password,
				load: loadKeystore,
			}).then(signingKeychainResult => {
				signingKeychainResult.map(
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
				)
			})

			return methods
		},

		deriveNextAccount: (input?: DeriveNextInput) => {
			const derivation: DeriveNextInput = input ?? {}
			deriveNextLocalHDAccountSubject.next(derivation)
			return methods
		},

		deriveHWAccount: (
			input: DeriveHWSigningKeyInput,
		): Observable<AccountT> =>
			wallet$.pipe(mergeMap(wallet => wallet.deriveHWAccount(input))),

		displayAddressForActiveHWAccountOnHWDeviceForVerification:
			(): Observable<void> =>
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

		decryptTransaction,

		logLevel: (level: LogLevel) => {
			log.setLevel(level)
			return methods
		},

		transactionStatus: (
			txID: TransactionIdentifierT,
			trigger: Observable<number>,
		) =>
			trigger.pipe(
				mergeMap(_ => from(radixAPI())),
				withLatestFrom(networkSubject),
				mergeMap(([api, network]) =>
					api.transactionStatus(txID, network),
				),
				map(status => status._unsafeUnwrap()),
				distinctUntilChanged((prev, cur) => prev.status === cur.status),
				filter(({ txID }) => txID.equals(txID)),
				tap(({ status }) =>
					radixLog.info(
						`Got transaction status ${status.toString()} for txID: ${txID.toString()}`,
					),
				),
			),

		revealMnemonic,
		activeAddress,
		activeAccount,
		accounts,

		tokenBalances: pipe(
			() => firstValueFrom(activeAddress),
			andThen(address => getAPICall('tokenBalancesForAddress')(address)),
			andThen(result =>
				result.map(response => response.account_balances),
			),
		),

		stakingPositions: pipe(
			() => firstValueFrom(activeAddress),
			andThen(address => getAPICall('stakesForAddress')(address)),
		),

		unstakingPositions: pipe(
			() => firstValueFrom(activeAddress),
			andThen(address => getAPICall('unstakesForAddress')(address)),
		),

		lookupTransaction: pipe(
			(txID: TransactionIdentifierT) =>
				firstValueFrom(networkSubject).then(network =>
					getAPICall('transactionStatus')(txID, network),
				),
			andThen(result =>
				result.andThen(tx =>
					ResultAsync.fromPromise(
						firstValueFrom(activeAddress),
						e => e as Error[],
					).map(address =>
						decorateSimpleExecutedTransactionWithType(tx, address),
					),
				),
			),
		),

		transactionHistory,

		transferTokens: async (
			to: AccountAddressT,
			amount: AmountT,
			tokenIdentifier: ResourceIdentifierT,
			message?: TxMessage,
			options: MakeTransactionOptions = {},
		): Promise<Result<SendTxOutput, Error[]>> => {
			const account = await firstValueFrom(activeAccount)
			const radixAPI = await firstValueFrom(radixAPI$)
			const network = await firstValueFrom(networkSubject)

			return pipe(
				() =>
					createTransfer({
						from_account: account.address.toPrimitive(),
						to_account: to.toPrimitive(),
						amount: amount.toString(),
						rri: tokenIdentifier.toPrimitive(),
					}),
				result =>
					result.asyncAndThen(transfer =>
						buildTransaction(transfer)(account, message),
					),
				result =>
					result.map(actions =>
						sendTransaction({
							account,
							options,
							radixAPI,
							txIntent: actions,
							network,
						}),
					),
			)()
		},

		stakeTokens: async (
			validator: ValidatorAddressT,
			amount: AmountT,
			options: MakeTransactionOptions = {},
		) => {
			const account = await firstValueFrom(activeAccount)
			const rri = await firstValueFrom(xrdRRI$)
			const radixAPI = await firstValueFrom(radixAPI$)
			const network = await firstValueFrom(networkSubject)

			return pipe(
				() =>
					createStake({
						to_validator: validator.toPrimitive(),
						amount: amount.toString(),
						rri: rri.toPrimitive(),
						from_account: account.address.toPrimitive(),
					}),
				result => result.map(buildTransaction),
				result => result.asyncAndThen(build => build(account)),
				result =>
					result.map(actions =>
						sendTransaction({
							account,
							options,
							radixAPI,
							txIntent: actions,
							network,
						}),
					),
			)()
		},

		unstakeTokens: async (
			validator: ValidatorAddressT,
			amount: AmountT,
			options: MakeTransactionOptions = {},
		) => {
			const account = await firstValueFrom(activeAccount)
			const rri = await firstValueFrom(xrdRRI$)
			const radixAPI = await firstValueFrom(radixAPI$)
			const network = await firstValueFrom(networkSubject)

			return pipe(
				() =>
					createUnstake({
						from_validator: validator.toPrimitive(),
						amount: amount.toString(),
						to_account: account.address.toPrimitive(),
						rri: rri.toPrimitive(),
					}),
				result => result.map(buildTransaction),
				result => result.asyncAndThen(build => build(account)),
				result =>
					result.map(actions =>
						sendTransaction({
							account,
							options,
							radixAPI,
							txIntent: actions,
							network,
						}),
					),
			)()
		},

		validators: async () => {
			const network = await firstValueFrom(networkSubject)
			return getAPICall('validators')(network)
		},
		lookupValidator: getAPICall('lookupValidator'),
	}

	return methods
}

export const Radix = {
	create,
}
