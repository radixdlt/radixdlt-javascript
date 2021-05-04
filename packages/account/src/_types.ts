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

export enum HDAccountTypeIdentifier {
	LOCAL = 'LOCAL',
	HARDWARE_OR_REMOTE = 'HARDWARE_OR_REMOTE',
}

export enum AccountTypeIdentifier {
	HD_ACCOUNT = 'HD_ACCOUNT',
	NON_HD_ACCOUNT = 'NON_HD_ACCOUNT',
}

export type BaseAccountTypeT<T extends AccountTypeIdentifier> = Readonly<{
	typeIdentifier: T
	isHDAccount: boolean
	isHardwareAccount: boolean
	uniqueKey: string
}>

export type AccountTypeHDT = BaseAccountTypeT<AccountTypeIdentifier.HD_ACCOUNT> &
	Readonly<{
		hdAccountType: HDAccountTypeIdentifier
		hdPath: HDPathRadixT
	}>

export type AccountTypeNonHDT = BaseAccountTypeT<AccountTypeIdentifier.NON_HD_ACCOUNT> &
	Readonly<{
		name?: string
	}>

export type AccountTypeT = AccountTypeHDT | AccountTypeNonHDT

export type AccountT = Signing &
	Encrypting &
	Decrypting &
	Readonly<{
		// Type of account: `AccountTypeHDT` or `AccountTypeNonHDT`, where HD has `hdAccountType` which can be `LOCAL` or `HARDWARE_OR_REMOTE` (e.g. Ledger Nano)
		type: AccountTypeT
		publicKey: PublicKey

		// sugar for `type.uniqueKey`
		uniqueIdentifier: string

		// Useful for debugging.
		toString: () => string

		// Sugar for thisAccount.publicKey.equals(other.publicKey)
		equals: (other: AccountT) => boolean

		// Sugar for `type.hdPath`, iff, type.typeIdentifier === AccountTypeHDT
		hdPath?: HDPathRadixT

		// Sugar for `type.isHDAccount`
		isHDAccount: boolean
		// Sugar for `type.isHardwareAccount`
		isHardwareAccount: boolean
		// Sugar for `isHDAccount && !isHardwareAccount`
		isLocalHDAccount: boolean
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
	toString: () => string
	equals: (other: AccountsT) => boolean

	// Get only HD account, by its path
	getHDAccountByHDPath: (hdPath: HDPathRadixT) => Option<AccountT>
	// Get any account by its public key
	getAnyAccountByPublicKey: (publicKey: PublicKey) => Option<AccountT>

	all: AccountT[]

	hdAccounts: () => AccountT[]
	localHDAccounts: () => AccountT[]
	hardwareHDAccounts: () => AccountT[]
	nonHDAccounts: () => AccountT[]

	// size of `all` accounts.
	size: () => number
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

export type WalletT = Signing &
	Readonly<{
		// should only be used for testing
		__unsafeGetAccount: () => AccountT

		revealMnemonic: () => MnemomicT

		restoreLocalHDAccountsUpToIndex: (
			index: number,
		) => Observable<AccountsT>

		deriveNextLocalHDAccount: (
			input?: DeriveNextAccountInput,
		) => Observable<AccountT>

		switchAccount: (input: SwitchAccountInput) => AccountT

		observeActiveAccount: () => Observable<AccountT>
		observeAccounts: () => Observable<AccountsT>
	}>
