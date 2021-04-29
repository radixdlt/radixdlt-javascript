import {
	Observable,
	BehaviorSubject,
	ReplaySubject,
	throwError,
	combineLatest,
	of,
} from 'rxjs'
import { Account } from './account'
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
	mergeMap,
	map,
	distinctUntilChanged,
	take,
	shareReplay,
} from 'rxjs/operators'
import { Keystore, KeystoreT, PrivateKey, Signature } from '@radixdlt/crypto'
import { Option } from 'prelude-ts'
import { HDPathRadix, HDPathRadixT, Int32 } from './bip32'
import { isAccount } from './account'
import { arraysEqual, msgFromError } from '@radixdlt/util'
import { MnemomicT, HDMasterSeed, Mnemonic } from './bip39'
import { ResultAsync } from 'neverthrow'
import { log } from '@radixdlt/util'

const __unsafeCreateWithPrivateKeyProvider = (
	input: Readonly<{
		mnemonic: MnemomicT
		__privateKeyProvider?: (hdpath: HDPathRadixT) => PrivateKey
		startWithAnAccount?: boolean
	}>,
): WalletT => {
	const { __privateKeyProvider, mnemonic } = input
	const startWithAnAccount = input.startWithAnAccount ?? true
	const masterSeed = HDMasterSeed.fromMnemonic({ mnemonic })
	const hdNodeDeriverWithBip32Path = masterSeed.masterNode().derive

	const activeAccountSubject = new ReplaySubject<AccountT>()

	const accountsSubject = new BehaviorSubject<Map<string, AccountT>>(
		new Map(),
	)

	const revealMnemonic = (): MnemomicT => mnemonic

	const numberOfAccounts = (): number => accountsSubject.getValue().size

	const _deriveWithPath = (
		input: Readonly<{
			hdPath: HDPathRadixT
			alsoSwitchTo?: boolean // defaults to false
		}>,
	): Observable<AccountT> => {
		const { hdPath } = input
		const alsoSwitchTo = input.alsoSwitchTo ?? false
		log.info(
			`Deriving new account, hdPath: ${hdPath.toString()}, alsoSwitchTo: ${
				alsoSwitchTo ? 'YES' : 'NO'
			} `,
		)

		const newAccount =
			__privateKeyProvider !== undefined
				? Account.__unsafeFromPrivateKey({
						privateKey: __privateKeyProvider(hdPath),
						hdPath,
				  })
				: Account.byDerivingNodeAtPath({
						hdPath,
						deriveNodeAtPath: () =>
							hdNodeDeriverWithBip32Path(hdPath),
				  })
		const accounts = accountsSubject.getValue()

		const key = newAccount.toString()

		if (accounts.has(key)) {
			const errMsg = `Incorrect implementation, wallet already contains account with hdPath: ${key}`
			console.error(errMsg)
			throw new Error(errMsg)
		}

		accounts.set(key, newAccount)
		accountsSubject.next(accounts)

		if (alsoSwitchTo) {
			activeAccountSubject.next(newAccount)
		}
		return of(newAccount)
	}

	const _deriveAtIndex = (
		input: Readonly<{
			addressIndex: Readonly<{
				index: Int32
				isHardened?: boolean // defaults to true
			}>
			alsoSwitchTo?: boolean // defaults to false
		}>,
	): Observable<AccountT> =>
		_deriveWithPath({
			hdPath: HDPathRadix.create({
				address: input.addressIndex,
			}),
			alsoSwitchTo: input.alsoSwitchTo,
		})

	const deriveNext = (input?: DeriveNextAccountInput): Observable<AccountT> =>
		_deriveAtIndex({
			addressIndex: {
				index: numberOfAccounts(),
				isHardened: input?.isHardened ?? true,
			},
			alsoSwitchTo: input?.alsoSwitchTo,
		})
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
			const lastIndex = numberOfAccounts() - 1
			return switchAccount({ toIndex: lastIndex })
		} else if (input === 'first') {
			return switchAccount({ toIndex: 0 })
		} else if (isSwitchToAccount(input)) {
			const toAccount = input.toAccount
			activeAccountSubject.next(toAccount)
			log.info(`Active account switched to: ${toAccount.toString()}`)
			return toAccount
		} else if (isSwitchToAccountIndex(input)) {
			const unsafeTargetIndex = input.toIndex
			const accounts = accountsSubject.getValue()

			const safeTargetIndex = Math.min(unsafeTargetIndex, accounts.size)

			const firstAccount = Array.from(accounts.values())[safeTargetIndex]
			if (!firstAccount) {
				throw new Error('No accounts...')
			}
			return switchAccount({ toAccount: firstAccount })
		} else {
			throw new Error('should never happen')
		}
	}

	if (startWithAnAccount) {
		deriveNext({ alsoSwitchTo: true })
	}

	const activeAccount$ = activeAccountSubject
		.asObservable()
		.pipe(distinctUntilChanged((a: AccountT, b: AccountT) => a.equals(b)))

	const accounts$ = accountsSubject.asObservable().pipe(
		map(
			(map): AccountsT => {
				const all = Array.from(map.values())
				return {
					equals: (other: AccountsT): boolean => {
						return arraysEqual(other.all, all)
					},
					get: (hdPath: HDPathRadixT): Option<AccountT> =>
						Option.of(map.get(hdPath.toString())),
					all,
					size: map.size,
				}
			},
		),
		distinctUntilChanged((a: AccountsT, b: AccountsT): boolean => {
			return a.equals(b)
		}),
		shareReplay(),
	)

	const restoreAccountsUpToIndex = (index: number): Observable<AccountsT> => {
		if (index < 0) {
			const errMsg = `targetIndex must not be negative`
			console.error(errMsg)
			return throwError(new Error(errMsg))
		}

		const numberOfAccountsToCreate = index - numberOfAccounts()
		if (numberOfAccountsToCreate < 0) {
			return accounts$
		}
		const offset = numberOfAccounts()

		const accountsObservableList: Observable<AccountT>[] = Array(
			numberOfAccountsToCreate,
		)
			.fill(undefined)
			.map((_, index) =>
				_deriveAtIndex({ addressIndex: { index: offset + index } }),
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
			const accounts = accountsSubject.getValue()
			const key: string | undefined = accounts.keys()?.next().value
			if (!key) {
				throw new Error('No account')
			}
			const account = accounts.get(key)
			if (!account) {
				throw new Error('No account')
			}
			return account
		},
		deriveNext,
		switchAccount,
		restoreAccountsUpToIndex,
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
