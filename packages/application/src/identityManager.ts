import {
	WalletT,
	NetworkT,
	AccountT,
	AccountsT,
	AccountAddressT,
	DeriveNextAccountInput,
	AccountAddress,
} from '@radixdlt/account'
import { IdentityManagerT, IdentityT, IdentitiesT } from './_types'
import { Observable } from 'rxjs'
import { Identity } from './identity'
import { map } from 'rxjs/operators'
import { Option } from 'prelude-ts'

const create = (
	input: Readonly<{
		wallet: WalletT
		network: NetworkT
	}>,
): IdentityManagerT => {
	const { network, wallet } = input
	const aToAddr = (account: AccountT): AccountAddressT =>
		AccountAddress.fromPublicKeyAndNetwork({
			network,
			publicKey: account.publicKey,
		})

	const aToI = (account: AccountT): IdentityT =>
		Identity.create({ account, accountAddress: aToAddr(account) })
	const asToIs = (accounts: AccountsT): IdentitiesT => {
		return {
			all: accounts.all.map(aToI),
			get: (hdPath): Option<IdentityT> => {
				return accounts.get(hdPath).map(aToI)
			},
			size: accounts.size,
		}
	}

	return {
		__unsafeGetIdentity: (): IdentityT => {
			return aToI(wallet.__unsafeGetAccount())
		},

		revealMnemonic: wallet.revealMnemonic,

		deriveNextIdentity: (
			input?: DeriveNextAccountInput,
		): Observable<IdentityT> => {
			return wallet.deriveNext(input).pipe(map(aToI))
		},

		observeActiveIdentity: (): Observable<IdentityT> => {
			return wallet.observeActiveAccount().pipe(map(aToI))
		},

		observeIdentities: (): Observable<IdentitiesT> => {
			return wallet.observeAccounts().pipe(map(asToIs))
		},

		restoreIdentitiesUpToIndex: (
			index: number,
		): Observable<IdentitiesT> => {
			return wallet.restoreAccountsUpToIndex(index).pipe(map(asToIs))
		},

		switchIdentity: (input): IdentityT => {
			return aToI(wallet.switchAccount(input))
		},
	}
}

export const IdentityManager = {
	create,
}
