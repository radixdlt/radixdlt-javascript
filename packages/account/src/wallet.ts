import {
	BehaviorSubject,
	combineLatest,
	Observable,
	of,
	Subscription,
	throwError,
} from 'rxjs'
import { Account, isAccount } from './account'
import {
	AccountsT,
	AccountT,
	DeriveNextAccountInput,
	SwitchAccountInput,
	SwitchToAccount,
	SwitchToAccountIndex,
	WalletT,
} from './_types'
import {
	distinctUntilChanged,
	filter,
	map,
	mergeMap,
	shareReplay,
	take,
	tap,
} from 'rxjs/operators'
import {
	Keystore,
	KeystoreT,
	PrivateKey,
	PublicKey,
	Signature,
} from '@radixdlt/crypto'
import { Option } from 'prelude-ts'
import { HDPathRadix, HDPathRadixT, Int32 } from './bip32'
import { arraysEqual, log, msgFromError } from '@radixdlt/util'
import { HDMasterSeed, MnemomicT, Mnemonic } from './bip39'
import { ResultAsync } from 'neverthrow'

const stringifyAccountsArray = (accounts: AccountT[]): string =>
	accounts.map((a) => a.toString()).join(',\n')

const stringifyAccounts = (accounts: AccountsT): string => {
	const allAccountsString = stringifyAccountsArray(accounts.all)

	return `
		size: ${accounts.size()},
		#hdAccounts: ${accounts.hdAccounts().length},
		#nonHDAccounts: ${accounts.nonHDAccounts().length},
		#localHDAccounts: ${accounts.localHDAccounts().length},
		#hardwareHDAccounts: ${accounts.hardwareHDAccounts().length},
		
		all: ${allAccountsString}
	`
}

type MutableAccountsT = AccountsT &
	Readonly<{
		add: (account: AccountT) => void
	}>

const createAccounts = (_all: AccountT[]): MutableAccountsT => {
	const all: AccountT[] = []

	const getHDAccountByHDPath = (hdPath: HDPathRadixT): Option<AccountT> => {
		const account = all
			.filter((a) => a.isHDAccount)
			.find((a) => a.hdPath!.equals(hdPath))
		return Option.of(account)
	}

	const getAnyAccountByPublicKey = (
		publicKey: PublicKey,
	): Option<AccountT> => {
		const account = all.find((a) => a.publicKey.equals(publicKey))
		return Option.of(account)
	}

	const localHDAccounts = () => all.filter((a) => a.isLocalHDAccount)
	const hardwareHDAccounts = () => all.filter((a) => a.isHardwareAccount)
	const nonHDAccounts = () => all.filter((a) => !a.isHDAccount)
	const hdAccounts = () => all.filter((a) => a.isHDAccount)

	const add = (account: AccountT): void => {
		if (
			all.find((a) => a.type.uniqueKey === account.type.uniqueKey) !==
			undefined
		) {
			// already there
			return
		}
		// new
		all.push(account)
	}

	const accounts: MutableAccountsT = {
		toString: (): string => {
			throw new Error('Overriden below')
		},
		equals: (other: AccountsT): boolean => {
			return arraysEqual(other.all, all)
		},
		add,
		localHDAccounts,
		hardwareHDAccounts,
		nonHDAccounts,
		hdAccounts,
		all,
		size: () => all.length,
		getHDAccountByHDPath,
		getAnyAccountByPublicKey,
	}

	return {
		...accounts,
		toString: (): string => stringifyAccounts(accounts),
	}
}

const MutableAccounts = {
	create: createAccounts,
}

const __unsafeCreateWithPrivateKeyProvider = (
	input: Readonly<{
		mnemonic: MnemomicT
		__privateKeyProvider?: (hdpath: HDPathRadixT) => PrivateKey
		startWithAnAccount?: boolean
	}>,
): WalletT => {
	const subs = new Subscription()
	const { __privateKeyProvider, mnemonic } = input
	const startWithAnAccount = input.startWithAnAccount ?? true
	const masterSeed = HDMasterSeed.fromMnemonic({ mnemonic })
	const hdNodeDeriverWithBip32Path = masterSeed.masterNode().derive

	const activeAccountSubject = new BehaviorSubject<Option<AccountT>>(
		Option.none<AccountT>(),
	)

	const accountsSubject = new BehaviorSubject<MutableAccountsT>(
		MutableAccounts.create([]),
	)

	const revealMnemonic = (): MnemomicT => mnemonic

	const numberOfAllAccounts = (): number => accountsSubject.getValue().size()
	const numberOfLocalHDAccounts = (): number =>
		accountsSubject.getValue().localHDAccounts().length

	const _addNewAccount = (
		input: Readonly<{
			newAccount$: Observable<AccountT>
			alsoSwitchTo?: boolean // defaults to false
		}>,
	): Observable<AccountT> => {
		const alsoSwitchTo = input.alsoSwitchTo ?? false

		return input.newAccount$.pipe(
			tap((newAccount: AccountT) => {
				const accounts = accountsSubject.getValue()

				accounts.add(newAccount)

				accountsSubject.next(accounts)

				if (alsoSwitchTo) {
					activeAccountSubject.next(Option.some(newAccount))
				}
				return of(newAccount)
			}),
		)
	}

	const _deriveLocalHDAccountWithPath = (
		input: Readonly<{
			hdPath: HDPathRadixT
			alsoSwitchTo?: boolean // defaults to false
		}>,
	): Observable<AccountT> => {
		const { hdPath } = input
		const deriveLocalHDAccount = (): Observable<AccountT> => {
			return __privateKeyProvider !== undefined
				? of(
						Account.__unsafeFromPrivateKeyAtHDPath({
							privateKey: __privateKeyProvider(hdPath),
							hdPath,
						}),
				  )
				: of(
						Account.byDerivingNodeAtPath({
							hdPath,
							deriveNodeAtPath: () =>
								hdNodeDeriverWithBip32Path(hdPath),
						}),
				  )
		}

		return _addNewAccount({
			newAccount$: deriveLocalHDAccount(),
			alsoSwitchTo: input.alsoSwitchTo,
		})
	}

	const _deriveNextLocalHDAccountAtIndex = (
		input: Readonly<{
			addressIndex: Readonly<{
				index: Int32
				isHardened?: boolean // defaults to true
			}>
			alsoSwitchTo?: boolean // defaults to false
		}>,
	): Observable<AccountT> =>
		_deriveLocalHDAccountWithPath({
			hdPath: HDPathRadix.create({
				address: input.addressIndex,
			}),
			alsoSwitchTo: input.alsoSwitchTo,
		})

	const deriveNextLocalHDAccount = (
		input?: DeriveNextAccountInput,
	): Observable<AccountT> => {
		const index = numberOfLocalHDAccounts()
		return _deriveNextLocalHDAccountAtIndex({
			addressIndex: {
				index,
				isHardened: input?.isHardened ?? true,
			},
			alsoSwitchTo: input?.alsoSwitchTo,
		})
	}

	const switchAccount = (input: SwitchAccountInput): AccountT => {
		const isSwitchToAccount = (
			something: unknown,
		): something is SwitchToAccount => {
			const inspection = input as SwitchToAccount
			return (
				inspection.toAccount !== undefined &&
				isAccount(inspection.toAccount)
			)
		}

		const isSwitchToAccountIndex = (
			something: unknown,
		): something is SwitchToAccountIndex => {
			const inspection = input as SwitchToAccountIndex
			return inspection.toIndex !== undefined
		}

		if (input === 'last') {
			const lastIndex = numberOfAllAccounts() - 1
			return switchAccount({ toIndex: lastIndex })
		} else if (input === 'first') {
			return switchAccount({ toIndex: 0 })
		} else if (isSwitchToAccount(input)) {
			const toAccount = input.toAccount
			activeAccountSubject.next(Option.some(toAccount))
			log.info(`Active account switched to: ${toAccount.toString()}`)
			return toAccount
		} else if (isSwitchToAccountIndex(input)) {
			const unsafeTargetIndex = input.toIndex
			const accounts = accountsSubject.getValue()

			const safeTargetIndex = Math.min(unsafeTargetIndex, accounts.size())

			const firstAccount = Array.from(accounts.all)[safeTargetIndex]
			if (!firstAccount) {
				throw new Error('No accounts...')
			}
			return switchAccount({ toAccount: firstAccount })
		} else {
			throw new Error('should never happen')
		}
	}

	if (startWithAnAccount) {
		subs.add(
			deriveNextLocalHDAccount({
				alsoSwitchTo: true,
			}).subscribe(),
		)
	}

	const activeAccount$ = activeAccountSubject.asObservable().pipe(
		filter((oa) => oa.isSome()),
		map((oa) =>
			oa.getOrThrow(new Error('Incorrect impl, expected .some(account)')),
		),
		distinctUntilChanged((a: AccountT, b: AccountT) => a.equals(b)),
		shareReplay(),
	)

	const accounts$ = accountsSubject.asObservable().pipe(shareReplay())

	const restoreLocalHDAccountsUpToIndex = (
		index: number,
	): Observable<AccountsT> => {
		if (index < 0) {
			const errMsg = `targetIndex must not be negative`
			console.error(errMsg)
			return throwError(new Error(errMsg))
		}

		const localHDAccountsSize = numberOfLocalHDAccounts()
		const numberOfAccountsToCreate = index - localHDAccountsSize
		if (numberOfAccountsToCreate < 0) {
			return accounts$
		}

		const accountsObservableList: Observable<AccountT>[] = Array(
			numberOfAccountsToCreate,
		)
			.fill(undefined)
			.map((_, index) =>
				_deriveNextLocalHDAccountAtIndex({
					addressIndex: { index: localHDAccountsSize + index },
				}),
			)

		return combineLatest(accountsObservableList).pipe(
			mergeMap((_) => {
				return accounts$
			}),
			take(1),
		)
	}

	return {
		revealMnemonic,
		// should only be used for testing
		__unsafeGetAccount: (): AccountT => {
			return activeAccountSubject
				.getValue()
				.getOrThrow(new Error('No account'))
		},
		deriveNextLocalHDAccount,
		switchAccount,
		restoreLocalHDAccountsUpToIndex,
		observeAccounts: (): Observable<AccountsT> => accounts$,
		observeActiveAccount: (): Observable<AccountT> => activeAccount$,
		sign: (hashedMessage: Buffer): Observable<Signature> =>
			activeAccount$.pipe(mergeMap((a) => a.sign(hashedMessage))),
	}
}

const create = (
	input: Readonly<{
		mnemonic: MnemomicT
		startWithAnAccount?: boolean
	}>,
): WalletT => __unsafeCreateWithPrivateKeyProvider({ ...input })

const byLoadingAndDecryptingKeystore = (
	input: Readonly<{
		password: string
		load: () => Promise<KeystoreT>
		startWithAnAccount?: boolean
	}>,
): ResultAsync<WalletT, Error> => {
	const loadKeystore = (): ResultAsync<KeystoreT, Error> =>
		ResultAsync.fromPromise(input.load(), (e: unknown) => {
			const underlyingError = msgFromError(e)
			const errMsg = `Failed to load keystore, underlying error: '${underlyingError}'`
			log.error(errMsg)
			return new Error(errMsg)
		})
	return loadKeystore()
		.map((keystore: KeystoreT) => {
			log.info('Keystore successfully loaded.')
			return { ...input, keystore }
		})
		.andThen(Wallet.fromKeystore)
}

const fromKeystore = (
	input: Readonly<{
		keystore: KeystoreT
		password: string
		startWithAnAccount?: boolean
	}>,
): ResultAsync<WalletT, Error> =>
	Keystore.decrypt(input)
		.map((entropy) => ({ entropy }))
		.andThen(Mnemonic.fromEntropy)
		.map((mnemonic) => ({
			mnemonic,
			startWithAnAccount: input.startWithAnAccount,
		}))
		.map(create)

const byEncryptingMnemonicAndSavingKeystore = (
	input: Readonly<{
		mnemonic: MnemomicT
		password: string
		save: (keystoreToSave: KeystoreT) => Promise<void>
		startWithAnAccount?: boolean
	}>,
): ResultAsync<WalletT, Error> => {
	const { mnemonic, password, startWithAnAccount } = input

	const save = (keystoreToSave: KeystoreT): ResultAsync<KeystoreT, Error> =>
		ResultAsync.fromPromise(input.save(keystoreToSave), (e: unknown) => {
			const underlyingError = msgFromError(e)
			const errMsg = `Failed to save keystore, underlying error: '${underlyingError}'`
			log.error(errMsg)
			return new Error(errMsg)
		}).map(() => {
			log.info('Keystore successfully saved.')
			return keystoreToSave
		})

	return Keystore.encryptSecret({
		secret: mnemonic.entropy,
		password,
	})
		.andThen(save)
		.map((keystore: KeystoreT) => ({
			keystore,
			password,
			startWithAnAccount,
		}))
		.andThen(Wallet.fromKeystore)
}

export const Wallet = {
	__unsafeCreateWithPrivateKeyProvider,
	create,
	fromKeystore,
	byLoadingAndDecryptingKeystore,
	byEncryptingMnemonicAndSavingKeystore,
}
