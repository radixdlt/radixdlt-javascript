import {
	ECPointOnCurve,
	EncryptedMessageT,
	PublicKey,
	Signature,
} from '@radixdlt/crypto'
import { Observable } from 'rxjs'
import { Option } from 'prelude-ts'
import { HDPathRadixT, BIP32T } from './bip32'
import { MnemomicT } from './bip39'
import { AddressT, NetworkT } from './addresses'

export type PublicKeyDeriving = Readonly<{
	derivePublicKey: () => Observable<PublicKey>
}>

/* A reactive counterpart of `Signer` in '@radixdlt/crypto' package  */
export type Signing = Readonly<{
	sign: (hashedMessage: Buffer) => Observable<Signature>
}>

export type AccountEncryptionInput = Readonly<{
	plaintext: Buffer | string
	publicKeyOfOtherParty: PublicKey
}>

export type Encrypting = Readonly<{
	encrypt: (input: AccountEncryptionInput) => Observable<EncryptedMessageT>
}>

export type AccountDecryptionInput = Readonly<{
	encryptedMessage: Buffer | EncryptedMessageT
	publicKeyOfOtherParty: PublicKey
}>

export type Decrypting = Readonly<{
	decrypt: (input: AccountDecryptionInput) => Observable<string>
}>

export type AccountT = PublicKeyDeriving &
	Signing &
	Encrypting &
	Decrypting &
	Readonly<{
		hdPath: HDPathRadixT
		deriveAddress: () => Observable<AddressT>
		__unsafeGetPublicKey: () => PublicKey
	}>

/// A simple "interface" like type that this `account` package recognizes.
/// The `hardware-wallet` package will mark its type being this type +
/// additional decoration. We want the `hardware-wallet` package to be
/// dependent on this package, not the other way around, thus we need
/// some kind of simple "interface" like type here.
export type HardwareWalletSimpleT = Readonly<{
	diffieHellman: (
		input: Readonly<{
			hdPath: BIP32T
			publicKeyOfOtherParty: PublicKey
		}>,
	) => Observable<ECPointOnCurve>
	derivePublicKey: (hdPath: BIP32T) => Observable<PublicKey>
	sign: (
		input: Readonly<{
			hashedMessage: Buffer
			hdPath: BIP32T
		}>,
	) => Observable<Signature>
}>

export type AccountsT = Readonly<{
	get: (hdPath: HDPathRadixT) => Option<AccountT>
	all: AccountT[]
	size: number
}>

export type SwitchToAccount = Readonly<{ toAccount: AccountT }>
export type SwitchToAccountIndex = Readonly<{ toIndex: number }>

export type SwitchAccountInput =
	| 'first'
	| 'last'
	| SwitchToAccount
	| SwitchToAccountIndex

export type DeriveNextAccountInput =
	| undefined
	| Readonly<{
			isHardened?: boolean // defaults to true
			alsoSwitchTo?: boolean // defaults to false
	  }>

export type WalletT = PublicKeyDeriving &
	Signing &
	Readonly<{
		// should only be used for testing
		__unsafeGetAccount: () => AccountT

		revealMnemonic: () => MnemomicT

		// Call this once you can provide an observable providing network.
		provideNetworkId: (network: Observable<NetworkT>) => void
		deriveNext: (input?: DeriveNextAccountInput) => AccountT

		switchAccount: (input: SwitchAccountInput) => AccountT

		observeActiveAccount: () => Observable<AccountT>
		observeActiveAddress: () => Observable<AddressT>
		observeAccounts: () => Observable<AccountsT>
	}>
