import { Observable, BehaviorSubject, Subject } from 'rxjs'
import { accountFromPrivateKey } from './account'
import { AccountID, AccountT, WalletT } from './_types'
import { mergeMap } from 'rxjs/operators'

export const wallet = (
	input: Readonly<{
		accounts: Set<AccountT>
	}>,
): WalletT => {
	const accounts = Array.from(input.accounts)
	const activeAccountSubject = new Subject<AccountT>()

	const accountsSubject = new BehaviorSubject<Map<AccountID, AccountT>>(
		accounts.reduce((acc: Map<AccountID, AccountT>, curr: AccountT) => {
			acc.set(curr.accountId, curr)
			return acc
		}, new Map()),
	)

	const addAccount = (newAccount: AccountT): void => {
		const accountsMap = accountsSubject.getValue()
		if (accountsMap.has(newAccount.accountId)) {
			// Skip and don't falsly notify 'accountsSubject' about new account, since it is not new.
			return
		}
		accountsMap.set(newAccount.accountId, newAccount)
		accountsSubject.next(accountsMap)
	}

	const changeAccount = (to: AccountT): void => {
		if (!accountsSubject.getValue().has(to.accountId)) {
			addAccount(to)
		}
		activeAccountSubject.next(to)
	}

	const observeActiveAccount = (): Observable<AccountT> =>
		activeAccountSubject.asObservable()

	return {
		changeAccount,
		addAccount,
		observeActiveAccount,
		addAccountByPrivateKey: (pk) => addAccount(accountFromPrivateKey(pk)),
		observeAccounts: () => accountsSubject.asObservable(),
		derivePublicKey: () =>
			observeActiveAccount().pipe(mergeMap((a) => a.derivePublicKey())),
		sign: (m) => observeActiveAccount().pipe(mergeMap((a) => a.sign(m))),
	}
}
