import { Observable, BehaviorSubject, ReplaySubject, Subscription } from 'rxjs'
import { Account } from './account'
import {
	AccountsT,
	AccountT,
	AddressT,
	DeriveNextAccountInput,
	SwitchAccountInput,
	SwitchToAccount,
	SwitchToAccountIndex,
	WalletT,
} from './_types'
import { mergeMap, map, distinctUntilChanged } from 'rxjs/operators'
import { Keystore, KeystoreT, PublicKey, Signature } from '@radixdlt/crypto'
import { Option } from 'prelude-ts'
import { HDPathRadix, HDPathRadixT } from './bip32/_index'
import { isAccount } from './account'
import { Int32 } from './bip32/_types'
import { arraysEqual, msgFromError } from '@radixdlt/util'
import { MnemomicT } from './bip39/_types'
import { Magic } from '@radixdlt/primitives'
import { Address } from './address'
import { ResultAsync } from 'neverthrow'
import { HDMasterSeed } from './bip39/hdMasterSeed'
import { log } from '@radixdlt/util'
import { Mnemonic } from './bip39/mnemonic'

const create = (
	input: Readonly<{
		mnemonic: MnemomicT
		password: string
	}>,
): WalletT => {
	const masterSeed = HDMasterSeed.fromMnemonic({ mnemonic: input.mnemonic })
	const hdNodeDeriverWithBip32Path = masterSeed.masterNode().derive

	const subs = new Subscription()

	const activeAccountSubject = new ReplaySubject<AccountT>()

	const accountsSubject = new BehaviorSubject<Map<HDPathRadixT, AccountT>>(
		new Map(),
	)

	const revealMnemonic = (): MnemomicT => input.mnemonic

	const numberOfAccounts = (): number => accountsSubject.getValue().size

	const universeMagicSubject = new ReplaySubject<Magic>()
	const magic$ = universeMagicSubject.asObservable()

	const provideNetworkId = (magic$: Observable<Magic>): void => {
		magic$
			.subscribe((magic: Magic) => universeMagicSubject.next(magic))
			.add(subs)
	}

	const _deriveWithPath = (
		input: Readonly<{
			hdPath: HDPathRadixT
			alsoSwitchTo?: boolean // defaults to false
		}>,
	): AccountT => {
		const newAccount = Account.byDerivingNodeAtPath({
			hdPath: input.hdPath,
			deriveNodeAtPath: () => hdNodeDeriverWithBip32Path(input.hdPath),
			addressFromPublicKey: (publicKey: PublicKey) =>
				magic$.pipe(
					map((magic) =>
						Address.fromPublicKeyAndMagic({
							publicKey,
							magic,
						}),
					),
				),
		})
		const accounts = accountsSubject.getValue()
		accounts.set(newAccount.hdPath, newAccount)
		accountsSubject.next(accounts)

		if (input.alsoSwitchTo === true) {
			activeAccountSubject.next(newAccount)
		}
		return newAccount
	}

	const _deriveAtIndex = (
		input: Readonly<{
			addressIndex: Readonly<{
				index: Int32
				isHardened?: boolean // defaults to true
			}>
			alsoSwitchTo?: boolean // defaults to false
		}>,
	): AccountT =>
		_deriveWithPath({
			hdPath: HDPathRadix.create({
				address: input.addressIndex,
			}),
			alsoSwitchTo: input.alsoSwitchTo,
		})

	const deriveNext = (input?: DeriveNextAccountInput): AccountT =>
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
			log.info(
				`Active account switched to: ${toAccount.hdPath.toString()}`,
			)
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

	// Start by deriving first index (0).
	deriveNext({ alsoSwitchTo: true })

	const activeAccount$ = activeAccountSubject
		.asObservable()
		.pipe(
			distinctUntilChanged((a: AccountT, b: AccountT) =>
				a.hdPath.equals(b.hdPath),
			),
		)

	const accounts$ = accountsSubject.asObservable().pipe(
		map(
			(map): AccountsT => ({
				get: (hdPath: HDPathRadixT): Option<AccountT> =>
					Option.of(map.get(hdPath)),
				all: Array.from(map.values()),
				size: map.size,
			}),
		),
		distinctUntilChanged((a: AccountsT, b: AccountsT): boolean =>
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call
			arraysEqual(a.all, b.all),
		),
	)

	const activeAddress$ = activeAccount$.pipe(
		mergeMap((activeAccount) => activeAccount.deriveAddress()),
	)

	return {
		revealMnemonic,
		// should only be used for testing
		__unsafeGetAccount: (): AccountT => {
			const accounts = accountsSubject.getValue()
			const keyAny = accounts.keys()?.next()
			if (!keyAny) {
				throw new Error('No account')
			}
			const key = (keyAny.value as unknown) as HDPathRadixT
			const account = accounts.get(key)
			if (!account) {
				throw new Error('No account')
			}
			return account
		},
		provideNetworkId,
		deriveNext,
		switchAccount,
		observeAccounts: (): Observable<AccountsT> => accounts$,
		observeActiveAccount: (): Observable<AccountT> => activeAccount$,
		observeActiveAddress: (): Observable<AddressT> => activeAddress$,
		derivePublicKey: (): Observable<PublicKey> =>
			activeAccount$.pipe(mergeMap((a) => a.derivePublicKey())),
		sign: (hashedMessage: Buffer): Observable<Signature> =>
			activeAccount$.pipe(mergeMap((a) => a.sign(hashedMessage))),
	}
}

const byLoadingAndDecryptingKeystore = (
	input: Readonly<{
		password: string
		load: () => Promise<KeystoreT>
	}>,
): ResultAsync<WalletT, Error> => {
	const loadKeystore = (): ResultAsync<KeystoreT, Error> =>
		ResultAsync.fromPromise(input.load(), (e: unknown) => {
			const underlyingError = msgFromError(e)
			const errMsg = `Failed to load keystore, underlying error: '${underlyingError}'`
			log.alert(errMsg)
			return new Error(errMsg)
		})
	return loadKeystore()
		.map((k: KeystoreT) => {
			log.info('Keystore successfully loaded.')
			return { keystore: k, password: input.password }
		})
		.andThen(Wallet.fromKeystore)
}

const fromKeystore = (
	input: Readonly<{
		keystore: KeystoreT
		password: string
	}>,
): ResultAsync<WalletT, Error> =>
	Keystore.decrypt(input)
		.map((entropy) => ({ entropy }))
		.andThen(Mnemonic.fromEntropy)
		.map((mnemonic) => ({ mnemonic, password: input.password }))
		.map(create)

const byEncryptingMnemonicAndSavingKeystore = (
	input: Readonly<{
		mnemonic: MnemomicT
		password: string
		save: (keystoreToSave: KeystoreT) => Promise<void>
	}>,
): ResultAsync<WalletT, Error> => {
	const { mnemonic, password } = input

	const save = (keystoreToSave: KeystoreT): ResultAsync<KeystoreT, Error> =>
		ResultAsync.fromPromise(input.save(keystoreToSave), (e: unknown) => {
			const underlyingError = msgFromError(e)
			const errMsg = `Failed to save keystore, underlying error: '${underlyingError}'`
			log.alert(errMsg)
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
		.map((keystore: KeystoreT) => ({ keystore, password }))
		.andThen(Wallet.fromKeystore)
}

export const Wallet = {
	create,
	fromKeystore,
	byLoadingAndDecryptingKeystore,
	byEncryptingMnemonicAndSavingKeystore,
}
