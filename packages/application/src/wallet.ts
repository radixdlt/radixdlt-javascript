import {
	SigningKeychainT,
	SigningKeyT,
	SigningKeysT,
	AccountAddressT,
	DeriveNextInput,
	AccountAddress,
	DeriveHWSigningKeyInput,
	SigningKeychain,
} from '@radixdlt/account'
import {
	WalletT,
	AccountT,
	AccountsT,
	SwitchAccountInput,
	SwitchToAccount,
	AddAccountByPrivateKeyInput,
} from './_types'
import { Observable, of, throwError } from 'rxjs'
import { Account, isAccount } from './account'
import { map, mergeMap } from 'rxjs/operators'
import { Option } from 'prelude-ts'
import { PublicKeyT, HDPathRadixT, Mnemonic } from '@radixdlt/crypto'
import { Network } from '@radixdlt/primitives'
import { log } from '@radixdlt/util/dist/logging'
import { pipe } from 'ramda'

const skToAccount = (signingKey: SigningKeyT, network: Network): AccountT =>
	Account.create(AccountAddress.fromPublicKeyAndNetwork(signingKey.publicKey, network), signingKey)

const sksToAccounts = (signingKeys: SigningKeysT, network: Network): AccountsT => {
	const getAccountWithHDSigningKeyByHDPath = (
		hdPath: HDPathRadixT,
	): Option<AccountT> =>
		signingKeys.getHDSigningKeyByHDPath(hdPath).map(key => skToAccount(key, network))

	const getAnyAccountByPublicKey = (
		publicKey: PublicKeyT,
	): Option<AccountT> =>
		signingKeys.getAnySigningKeyByPublicKey(publicKey).map(key => skToAccount(key, network))

	const all = signingKeys.all.map(key => skToAccount(key, network))

	return {
		all,
		getAccountWithHDSigningKeyByHDPath,
		getAnyAccountByPublicKey,
		size: () => all.length,
	}
}

const createR = (
	mnemonic: string,
	network: Network
) => pipe(
	() => Mnemonic.fromEnglishPhrase(mnemonic),

	result => result.map(
		mnemonic => SigningKeychain.create({ mnemonic })
	),

	result => result.map(
		keychain => ({
			mnemonic,
			deriveNextLocalHDAccount: (input: Parameters<SigningKeychainT['deriveNextLocalHDSigningKey']>) => {
				const signingKey = keychain.deriveNextLocalHDSigningKey(...input)
				return skToAccount(signingKey, network)
			},
			/*
			deriveHWAccount: (
				input: DeriveHWSigningKeyInput,
			): Observable<AccountT> =>
				keychain.deriveHWSigningKey(input).pipe(map(skToAccount)),
				*/
			//displayAddressForActiveHWAccountOnHWDeviceForVerification
			observeActiveAccount: (): Observable<AccountT> => keychain.observeActiveSigningKey().pipe(map(key => skToAccount(key, network))),
			observeAccounts: (): Observable<AccountsT> => keychain.observeSigningKeys().pipe(map(keys => sksToAccounts())),
		})
	),
)

const create = (
	mnemonic: string,
	network: Network
): WalletT => {
	const mnenmonicResult = Mnemonic.fromEnglishPhrase(mnemonic)

	const skToAccountAddress = (signingKey: SigningKeyT): AccountAddressT =>
		AccountAddress.fromPublicKeyAndNetwork({
			network,
			publicKey: signingKey.publicKey,
		})

	const skToAccount = (signingKey: SigningKeyT): AccountT =>
		Account.create({ signingKey, address: skToAccountAddress(signingKey) })

	const sksToAccounts = (signingKeys: SigningKeysT): AccountsT => {
		const getAccountWithHDSigningKeyByHDPath = (
			hdPath: HDPathRadixT,
		): Option<AccountT> =>
			signingKeys.getHDSigningKeyByHDPath(hdPath).map(skToAccount)

		const getAnyAccountByPublicKey = (
			publicKey: PublicKeyT,
		): Option<AccountT> =>
			signingKeys.getAnySigningKeyByPublicKey(publicKey).map(skToAccount)

		const all = signingKeys.all.map(skToAccount)

		return {
			all,
			getAccountWithHDSigningKeyByHDPath,
			getAnyAccountByPublicKey,
			accountsWithHDSigningKeys: () =>
				signingKeys.hdSigningKeys().map(skToAccount),
			accountsWithHardwareHDSigningKeys: () =>
				signingKeys.hardwareHDSigningKeys().map(skToAccount),
			accountsWithLocalHDSigningKeys: () =>
				signingKeys.localHDSigningKeys().map(skToAccount),
			accountsWithNonHDSigningKeys: () =>
				signingKeys.nonHDSigningKeys().map(skToAccount),
			size: () => all.length,
		}
	}

	const observeActiveAccount = (): Observable<AccountT> =>
		signingKeychain.observeActiveSigningKey().pipe(map(skToAccount))

	const keychain = SigningKeychain.create({
		mnemonic: Mnemonic.fromEnglishPhrase(mnemonic)
	})

	return {
		__unsafeGetAccount: (): AccountT =>
			skToAccount(signingKeychain.__unsafeGetSigningKey()),

		revealMnemonic: signingKeychain.revealMnemonic,

		deriveNextLocalHDAccount: (
			input?: DeriveNextInput,
		): Observable<AccountT> =>
			signingKeychain
				.deriveNextLocalHDSigningKey(input)
				.pipe(map(skToAccount)),

		deriveHWAccount: (
			input: DeriveHWSigningKeyInput,
		): Observable<AccountT> =>
			signingKeychain.deriveHWSigningKey(input).pipe(map(skToAccount)),

		displayAddressForActiveHWAccountOnHWDeviceForVerification: (): Observable<void> =>
			observeActiveAccount().pipe(
				mergeMap(
					(a: AccountT): Observable<void> =>
						signingKeychain
							.__unsafeGetSigningKey()
							.getPublicKeyDisplayOnlyAddress()
							.pipe(
								mergeMap(
									(pk: PublicKeyT): Observable<void> => {
										if (pk.equals(a.publicKey)) {
											return of(undefined)
										} else {
											const errMsg = `Hardware wallet returned a different public key than the cached one, this is bad. Probably incorrect implementation.`
											log.error(errMsg)
											return throwError(new Error(errMsg))
										}
									},
								),
							),
				),
			),

		observeActiveAccount,
		observeAccounts: (): Observable<AccountsT> =>
			signingKeychain.observeSigningKeys().pipe(map(sksToAccounts)),

		addAccountFromPrivateKey: (
			input: AddAccountByPrivateKeyInput,
		): Observable<AccountT> =>
			of(skToAccount(signingKeychain.addSigningKeyFromPrivateKey(input))),

		restoreLocalHDAccountsToIndex: (index: number): Observable<AccountsT> =>
			signingKeychain
				.restoreLocalHDSigningKeysUpToIndex(index)
				.pipe(map(sksToAccounts)),

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
				return skToAccount(
					signingKeychain.switchSigningKey({
						toSigningKey: input.toAccount.signingKey,
					}),
				)
			} else {
				return skToAccount(signingKeychain.switchSigningKey(input))
			}
		},
	}
}

export const Wallet = {
	create,
}
