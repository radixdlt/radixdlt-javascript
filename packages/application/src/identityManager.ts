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
		/*
		* 	getByHDPath: (hdPath: HDPathRadixT) => Option<IdentityT>
	// Get any identity by its public key
	getByPublicKey: (publicKey: PublicKey) => Option<IdentityT>

	// ALL identities, basically a concatenation of `identitiesWithHDAccounts || identitiesWithNonHDAccounts`
	all: IdentityT[]

	identitiesWithNonHDAccounts: IdentityT[]

	identitiesWithLocalHDAccounts: IdentityT[]
	identitiesWithHardwareHDAccounts: IdentityT[]

	// Concatenation of `identitiesWithLocalHDAccounts || identitiesWithHardwareHDAccounts`
	identitiesWithHDAccounts: IdentityT[]

		* */
		// return {
		// 	all: accounts.all.map(aToI),
		// 	get: (hdPath): Option<IdentityT> => {
		// 		return accounts.get(hdPath).map(aToI)
		// 	},
		// 	size: accounts.size,
		// }
		throw new Error('impl me')
	}

	return {
		__unsafeGetIdentity: (): IdentityT => {
			return aToI(wallet.__unsafeGetAccount())
		},

		revealMnemonic: wallet.revealMnemonic,

		deriveNextLocalHDIdentity: (
			input?: DeriveNextAccountInput,
		): Observable<IdentityT> => {
			return wallet.deriveNextLocalHDAccount(input).pipe(map(aToI))
		},

		observeActiveIdentity: (): Observable<IdentityT> => {
			return wallet.observeActiveAccount().pipe(map(aToI))
		},

		observeIdentities: (): Observable<IdentitiesT> => {
			return wallet.observeAccounts().pipe(map(asToIs))
		},

		restoreIdentitiesForLocalHDAccountsUpToIndex: (
			index: number,
		): Observable<IdentitiesT> => {
			return wallet
				.restoreLocalHDAccountsUpToIndex(index)
				.pipe(map(asToIs))
		},

		switchIdentity: (input): IdentityT => {
			return aToI(wallet.switchAccount(input))
		},
	}
}

export const IdentityManager = {
	create,
}
