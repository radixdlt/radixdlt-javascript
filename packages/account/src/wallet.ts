import {
	Observable,
	BehaviorSubject,
	ReplaySubject,
	Subscription,
	Subject,
} from 'rxjs'
import { Account } from './account'
import {
	AccountIndexPosition,
	AccountsT,
	AccountT,
	AddressT,
	TargetAccountIndexT,
	WalletT,
} from './_types'
import { mergeMap, map, distinctUntilChanged } from 'rxjs/operators'
import {
	Keystore,
	KeystoreT,
	PublicKey,
	Signature,
	UnsignedMessage,
} from '@radixdlt/crypto'
import { Option } from 'prelude-ts'
import { HDPathRadix, HDPathRadixT } from './bip32/_index'
import { isAccount } from './account'
import { Int32 } from './bip32/_types'
import { arraysEqual } from '@radixdlt/util'
import { HDMasterSeedT, MnemomicT } from './bip39/_types'
import { Magic } from '@radixdlt/primitives'
import { Address } from './address'
import { ResultAsync } from 'neverthrow'
import { HDMasterSeed } from './bip39/hdMasterSeed'
import { PathLike } from 'fs'
import { FileHandle } from 'fs/promises'

// eslint-disable-next-line max-lines-per-function
const create = (
	input: Readonly<{
		masterSeed: HDMasterSeedT
	}>,
): WalletT => {
	// Even locally in memory we don't save the `masterSeed`, we just save
	// a reference to the derivation function.
	const hdNodeDeriverWithBip32Path = input.masterSeed.masterNode().derive

	const subs = new Subscription()

	const activeAccountSubject = new ReplaySubject<AccountT>(1)

	const accountsSubject = new BehaviorSubject<Map<HDPathRadixT, AccountT>>(
		new Map(),
	)
	const numberOfAccounts = (): number => accountsSubject.getValue().size

	const universeMagicSubject = new Subject<Magic>()

	const provideMagic = (magic: Observable<Magic>): void => {
		magic.subscribe(universeMagicSubject).add(subs)
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
				universeMagicSubject
					.asObservable()
					.pipe(
						map((magic) =>
							Address.fromPublicKeyAndMagic({ publicKey, magic }),
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

	const deriveNext = (
		input?: Readonly<{
			isHardened?: boolean // defaults to true
			alsoSwitchTo?: boolean // defaults to false
		}>,
	): AccountT =>
		_deriveAtIndex({
			addressIndex: {
				index: numberOfAccounts(),
				isHardened: input?.isHardened ?? true,
			},
			alsoSwitchTo: input?.alsoSwitchTo,
		})

	const switchAccount = (
		input: Readonly<{ to: AccountT | TargetAccountIndexT }>,
	): AccountT => {
		const targetAccountInput = input.to
		if (isAccount(targetAccountInput)) {
			activeAccountSubject.next(targetAccountInput)
			return targetAccountInput
		} else if (typeof targetAccountInput === 'number') {
			const unsorted = accountsSubject.getValue()
			const sortedKeys = [...unsorted.keys()].sort((a, b) =>
				Math.min(a.addressIndex.value(), b.addressIndex.value()),
			)
			const firstAccount = unsorted.get(sortedKeys[0])
			if (!firstAccount) {
				throw new Error('No accounts...')
			}
			return switchAccount({ to: firstAccount })
		} else {
			const accountIndexPosition = targetAccountInput as AccountIndexPosition
			switch (accountIndexPosition) {
				case AccountIndexPosition.FIRST: {
					return switchAccount({ to: 0 })
				}
				case AccountIndexPosition.LAST: {
					return switchAccount({ to: numberOfAccounts() - 1 })
				}
			}
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
		provideMagic,
		deriveNext,
		switchAccount,
		observeAccounts: (): Observable<AccountsT> => accounts$,
		observeActiveAccount: (): Observable<AccountT> => activeAccount$,
		observeActiveAddress: (): Observable<AddressT> => activeAddress$,
		derivePublicKey: (): Observable<PublicKey> =>
			activeAccount$.pipe(mergeMap((a) => a.derivePublicKey())),
		sign: (unsignedMessage: UnsignedMessage): Observable<Signature> =>
			activeAccount$.pipe(mergeMap((a) => a.sign(unsignedMessage))),
	}
}

const fromKeystore = (
	input: Readonly<{
		keystore: KeystoreT
		password: string
	}>,
): ResultAsync<WalletT, Error> =>
	Keystore.decrypt(input)
		.map(HDMasterSeed.fromSeed)
		.map((m) => ({ masterSeed: m }))
		.map(create)

const byEncryptingSeedOfMnemonic = (
	input: Readonly<{
		mnemonic: MnemomicT
		password: string
		saveKeystoreAtPath: PathLike | FileHandle
	}>,
): ResultAsync<WalletT, Error> => {
	const { mnemonic, password, saveKeystoreAtPath: filePath } = input
	const masterSeed = HDMasterSeed.fromMnemonic({ mnemonic })

	return Keystore.encryptSecret({
		secret: masterSeed.seed,
		password,
	})
		.map((keystore) => ({ keystore, filePath }))
		.andThen(Keystore.saveToFileAtPath)
		.map((keystore) => ({ keystore, password }))
		.andThen(Wallet.fromKeystore)
}

const fromKeystoreAtPath = (
	input: Readonly<{
		keystorePath: PathLike | FileHandle
		password: string
	}>,
): ResultAsync<WalletT, Error> => {
	const { keystorePath: filePath, password } = input
	return Keystore.fromFileAtPath(filePath)
		.map((k) => ({ keystore: k, password }))
		.andThen(Wallet.fromKeystore)
}

export const Wallet = {
	create,
	fromKeystore,
	fromKeystoreAtPath,
	byEncryptingSeedOfMnemonic,
}
