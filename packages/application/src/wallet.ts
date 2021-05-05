import {
	SigningKeychainT,
	NetworkT,
	SigningKeyT,
	SigningKeysT,
	AccountAddressT,
	DeriveNextInput,
	AccountAddress,
	HDPathRadixT,
} from '@radixdlt/account'
import {
	WalletT,
	AccountT,
	AccountsT,
	SwitchAccountInput,
	SwitchToAccount,
	AddAccountByPrivateKeyInput,
} from './_types'
import { Observable, of } from 'rxjs'
import { Account, isAccount } from './account'
import { map } from 'rxjs/operators'
import { Option } from 'prelude-ts'
import { PublicKey } from '@radixdlt/crypto'

const create = (
	input: Readonly<{
		signingKeychain: SigningKeychainT
		network: NetworkT
	}>,
): WalletT => {
	const { network, signingKeychain } = input
	const aToAddr = (signingKey: SigningKeyT): AccountAddressT =>
		AccountAddress.fromPublicKeyAndNetwork({
			network,
			publicKey: signingKey.publicKey,
		})

	const aToI = (signingKey: SigningKeyT): AccountT =>
		Account.create({ signingKey, accountAddress: aToAddr(signingKey) })

	const asToIs = (accounts: SigningKeysT): AccountsT => {
		const getAccountWithHDSigningKeyByHDPath = (
			hdPath: HDPathRadixT,
		): Option<AccountT> => {
			return accounts.getHDSigningKeyByHDPath(hdPath).map(aToI)
		}

		const getAnyAccountByPublicKey = (
			publicKey: PublicKey,
		): Option<AccountT> => {
			return accounts.getAnySigningKeyByPublicKey(publicKey).map(aToI)
		}

		const all = accounts.all.map(aToI)

		return {
			all,
			getAccountWithHDSigningKeyByHDPath,
			getAnyAccountByPublicKey,
			accountsWithHDSigningKeys: () => accounts.hdSigningKeys().map(aToI),
			accountsWithHardwareHDSigningKeys: () =>
				accounts.hardwareHDSigningKeys().map(aToI),
			accountsWithLocalHDSigningKeys: () =>
				accounts.localHDSigningKeys().map(aToI),
			accountsWithNonHDSigningKeys: () =>
				accounts.nonHDSigningKeys().map(aToI),
			size: () => all.length,
		}
	}

	return {
		__unsafeGetAccount: (): AccountT => {
			return aToI(signingKeychain.__unsafeGetSigningKey())
		},

		revealMnemonic: signingKeychain.revealMnemonic,

		deriveNextLocalHDAccount: (
			input?: DeriveNextInput,
		): Observable<AccountT> => {
			return signingKeychain.deriveNextLocalHDSigningKey(input).pipe(map(aToI))
		},

		observeActiveAccount: (): Observable<AccountT> => {
			return signingKeychain.observeActiveSigningKey().pipe(map(aToI))
		},

		observeAccounts: (): Observable<AccountsT> => {
			return signingKeychain.observeSigningKeys().pipe(map(asToIs))
		},

		addAccountFromPrivateKey: (
			input: AddAccountByPrivateKeyInput,
		): Observable<AccountT> => {
			return of(aToI(signingKeychain.addSigningKeyFromPrivateKey(input)))
		},

		restoreAccountsForLocalHDSigningKeysUpToIndex: (
			index: number,
		): Observable<AccountsT> => {
			return signingKeychain
				.restoreLocalHDSigningKeysUpToIndex(index)
				.pipe(map(asToIs))
		},

		switchAccount: (input: SwitchAccountInput): AccountT => {
			const isSwitchToAccount = (
				something: unknown,
			): something is SwitchToAccount => {
				const inspection = input as SwitchToAccount
				return (
					inspection.toAccount !== undefined &&
					isAccount(inspection.toAccount)
				)
			}

			if (isSwitchToAccount(input)) {
				return aToI(
					signingKeychain.switchSigningKey({
						toSigningKey: input.toAccount.signingKey,
					}),
				)
			} else {
				return aToI(signingKeychain.switchSigningKey(input))
			}
		},
	}
}

export const Wallet = {
	create,
}
