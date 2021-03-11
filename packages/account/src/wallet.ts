import { Observable, BehaviorSubject, ReplaySubject, of } from 'rxjs'
import { Account } from './account'
import {
	AccountIndexPosition,
	AccountsT,
	AccountT,
	MasterSeedProviderT,
	TargetAccountIndexT,
	WalletT,
} from './_types'
import { mergeMap, map, tap, distinctUntilChanged } from 'rxjs/operators'
import { PublicKey, Signature, UnsignedMessage } from '@radixdlt/crypto'
import { Option } from 'prelude-ts'
import { HDPathRadix, HDPathRadixT } from './bip32/_index'
import { isAccount } from './account'
import { throwError } from 'rxjs'
import { Int32 } from './bip32/_types'
import { arraysEqual } from '@radixdlt/util'

// eslint-disable-next-line max-lines-per-function
const create = (
	input: Readonly<{
		masterSeedProvider: MasterSeedProviderT
	}>,
): WalletT => {
	const hdMasterSeed = input.masterSeedProvider.masterSeed()

	const activeAccountSubject = new ReplaySubject<AccountT>()

	const accountsSubject = new BehaviorSubject<Map<HDPathRadixT, AccountT>>(
		new Map(),
	)

	const numberOfAccounts = (): number => accountsSubject.getValue().size

	const _deriveWithPath = (
		input: Readonly<{
			hdPath: HDPathRadixT
			alsoSwitchTo?: boolean // defaults to false
		}>,
	): Observable<AccountT> =>
		hdMasterSeed.pipe(
			map((seed) => ({ hdMasterSeed: seed, hdPath: input.hdPath })),
			map(Account.fromHDPathWithHDMasterSeed),
			tap({
				next: (account) => {
					const accounts = accountsSubject.getValue()
					accounts.set(account.hdPath, account)
					accountsSubject.next(accounts)

					if (input.alsoSwitchTo === true) {
						activeAccountSubject.next(account)
					}
				},
			}),
		)

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

	const deriveNext = (
		input?: Readonly<{
			isHardened?: boolean // defaults to true
			alsoSwitchTo?: boolean // defaults to false
		}>,
	): Observable<AccountT> =>
		_deriveAtIndex({
			addressIndex: {
				index: numberOfAccounts(),
				isHardened: input?.isHardened ?? true,
			},
			alsoSwitchTo: input?.alsoSwitchTo,
		})

	const switchAccount = (
		input: Readonly<{ to: AccountT | TargetAccountIndexT }>,
	): Observable<AccountT> => {
		const targetAccountInput = input.to
		if (isAccount(targetAccountInput)) {
			activeAccountSubject.next(targetAccountInput)
			return of(targetAccountInput)
		} else if (typeof targetAccountInput === 'number') {
			const unsorted = accountsSubject.getValue()
			const sortedKeys = [...unsorted.keys()].sort((a, b) =>
				Math.min(a.addressIndex.value(), b.addressIndex.value()),
			)
			const firstAccount = unsorted.get(sortedKeys[0])
			if (!firstAccount) {
				return throwError(() => new Error('No accounts...'))
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

	const observeActiveAccount = (): Observable<AccountT> =>
		activeAccountSubject
			.asObservable()
			.pipe(
				distinctUntilChanged((a: AccountT, b: AccountT) => a.equals(b)),
			)

	const observeAccounts = (): Observable<AccountsT> =>
		accountsSubject.asObservable().pipe(
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

	// Start by deriving first index!
	deriveNext()

	return {
		deriveNext,
		switchAccount,
		observeActiveAccount,
		observeAccounts,
		derivePublicKey: (): Observable<PublicKey> =>
			observeActiveAccount().pipe(mergeMap((a) => a.derivePublicKey())),
		sign: (unsignedMessage: UnsignedMessage): Observable<Signature> =>
			observeActiveAccount().pipe(
				mergeMap((a) => a.sign(unsignedMessage)),
			),
	}
}

export const Wallet = {
	create,
}
