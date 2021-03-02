import { Observable, BehaviorSubject, ReplaySubject } from 'rxjs'
import { Account } from './account'
import { AccountIdT, AccountsT, AccountT, WalletT } from './_types'
import { mergeMap, map } from 'rxjs/operators'
import { PublicKey } from '@radixdlt/crypto'
import { BIP32T } from './_index'
import { AccountId } from './accountId'
import { Option } from 'prelude-ts'
import { ValidationWitness } from '@radixdlt/util'
import { Result, err, ok } from 'neverthrow'

// eslint-disable-next-line max-lines-per-function
const create = (
	input: Readonly<{
		accounts: AccountT[]
	}>,
): WalletT => {
	const activeAccountSubject = new ReplaySubject<AccountT>()

	const accountsSubject = new BehaviorSubject<Map<string, AccountT>>(
		new Map(),
	)

	const addAccountOnDuplicatesSkip = (newAccount: AccountT): void => {
		const accountsMap = accountsSubject.getValue()
		if (accountsMap.has(newAccount.accountId.accountIdString)) {
			// Skip and don't falsly notify 'accountsSubject' about new account, since it is not new.
			return
		}
		const wasEmpty = accountsMap.size === 0
		accountsMap.set(newAccount.accountId.accountIdString, newAccount)
		accountsSubject.next(accountsMap)
		if (wasEmpty) {
			activeAccountSubject.next(newAccount)
		}
	}

	input.accounts.forEach(addAccountOnDuplicatesSkip)
	const addAccount = (
		newAccount: AccountT,
	): Result<ValidationWitness, Error> => {
		const accountsMap = accountsSubject.getValue()
		if (accountsMap.has(newAccount.accountId.accountIdString)) {
			return err(new Error('Account already added in wallet.'))
		}
		addAccountOnDuplicatesSkip(newAccount)
		return ok({ witness: 'Account added' })
	}

	const changeToUnsafe = (to: AccountT): void => {
		if (!accountsSubject.getValue().has(to.accountId.accountIdString)) {
			throw new Error('Account not found')
		}
		activeAccountSubject.next(to)
	}

	const changeAccount = (to: AccountT): Result<ValidationWitness, Error> => {
		if (!accountsSubject.getValue().has(to.accountId.accountIdString)) {
			return err(
				new Error('Unknown account, did you mean to add it first?'),
			)
		}
		changeToUnsafe(to)
		return ok({ witness: 'Changed to account' })
	}

	const observeActiveAccount = (): Observable<AccountT> =>
		activeAccountSubject.asObservable()

	if (input.accounts.length > 0) changeToUnsafe(input.accounts[0])

	const observeAccounts = (): Observable<AccountsT> =>
		accountsSubject.asObservable().pipe(
			map((map: Map<string, AccountT>) => ({
				get: (id: AccountIdT | PublicKey | BIP32T): Option<AccountT> =>
					Option.of(map.get(AccountId.create(id).accountIdString)),
				all: Array.from(map.values()),
			})),
		)

	return {
		changeAccount,
		addAccount,
		observeActiveAccount,
		addAccountByPrivateKey: (pk) => addAccount(Account.fromPrivateKey(pk)),
		observeAccounts,
		derivePublicKey: () =>
			observeActiveAccount().pipe(mergeMap((a) => a.derivePublicKey())),
		sign: (m) => observeActiveAccount().pipe(mergeMap((a) => a.sign(m))),
	}
}

export const Wallet = {
	create,
}
