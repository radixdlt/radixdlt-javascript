import {
	WalletT,
	NetworkT,
	AccountT,
	AccountsT,
	AccountAddressT,
	DeriveNextAccountInput,
	AccountAddress,
	HDPathRadixT,
} from '@radixdlt/account'
import { IdentityManagerT, IdentityT, IdentitiesT } from './_types'
import { Observable } from 'rxjs'
import { Identity } from './identity'
import { map } from 'rxjs/operators'
import { Option } from 'prelude-ts'
import { PublicKey, publicKeyCompressedByteCount } from '@radixdlt/crypto'

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
		const getIdentityWithHDAccountByHDPath = (
			hdPath: HDPathRadixT,
		): Option<IdentityT> => {
			return accounts.getHDAccountByHDPath(hdPath).map(aToI)
		}

		const getAnyIdentityByPublicKey = (
			publicKey: PublicKey,
		): Option<IdentityT> => {
			return accounts.getAnyAccountByPublicKey(publicKey).map(aToI)
		}

		const all = accounts.all.map(aToI)

		return {
			all,
			getIdentityWithHDAccountByHDPath,
			getAnyIdentityByPublicKey,
			identitiesWithHDAccounts: accounts.hdAccounts().map(aToI),
			identitiesWithHardwareHDAccounts: accounts
				.hardwareHDAccounts()
				.map(aToI),
			identitiesWithLocalHDAccounts: accounts.localHDAccounts().map(aToI),
			identitiesWithNonHDAccounts: accounts.nonHDAccounts().map(aToI),
			size: all.length,
		}
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
