import { Observable, BehaviorSubject, ReplaySubject } from 'rxjs'
import { accountFromPrivateKey } from './account'
import { AccountID, Accounts, AccountT, Maybe, WalletT } from './_types'
import { mergeMap, map } from 'rxjs/operators'
import { PublicKey } from '@radixdlt/crypto'
import { BIP32 } from './_index'
import { accountId } from './accountId'

// eslint-disable-next-line max-lines-per-function
export const makeWallet = (
	input: Readonly<{
		accounts: Set<AccountT>
	}>,
): WalletT => {
	const accounts = Array.from(input.accounts)
	const activeAccountSubject = new ReplaySubject<AccountT>()

	const accountsSubject = new BehaviorSubject<Map<string, AccountT>>(
		new Map(),
	)

	const addAccount = (newAccount: AccountT): void => {
		const accountsMap = accountsSubject.getValue()
		const wasEmpty = accountsMap.size === 0
		if (accountsMap.has(newAccount.accountId.accountIdString)) {
			// Skip and don't falsly notify 'accountsSubject' about new account, since it is not new.
			return
		}
		accountsMap.set(newAccount.accountId.accountIdString, newAccount)
		accountsSubject.next(accountsMap)
		if (wasEmpty) {
			activeAccountSubject.next(newAccount)
		}
	}

	accounts.forEach(addAccount)

	const changeAccount = (to: AccountT): void => {
		if (!accountsSubject.getValue().has(to.accountId.accountIdString)) {
			addAccount(to)
		}
		activeAccountSubject.next(to)
	}

	const observeActiveAccount = (): Observable<AccountT> =>
		activeAccountSubject.asObservable()

	if (accounts.length > 0) changeAccount(accounts[0])

	const observeAccounts = (): Observable<Accounts> =>
		accountsSubject.asObservable().pipe(
			map((map: Map<string, AccountT>) => ({
				get: (id: AccountID | PublicKey | BIP32): Maybe<AccountT> =>
					map.get(accountId(id).accountIdString),
				all: Array.from(map.values()),
			})),
		)

	return {
		changeAccount,
		addAccount,
		observeActiveAccount,
		addAccountByPrivateKey: (pk) => addAccount(accountFromPrivateKey(pk)),
		observeAccounts,
		derivePublicKey: () =>
			observeActiveAccount().pipe(mergeMap((a) => a.derivePublicKey())),
		sign: (m) => observeActiveAccount().pipe(mergeMap((a) => a.sign(m))),
	}
}
