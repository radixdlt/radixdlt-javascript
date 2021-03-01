import { DSONCodable, JSONEncodable } from '@radixdlt/data-formats'
import { Byte, ValidationWitness } from '@radixdlt/util'
import {
	PrivateKey,
	PublicKey,
	Signature,
	UnsignedMessage,
} from '@radixdlt/crypto'
import { Observable } from 'rxjs'
import { BIP32T } from './bip32/_types'
import { Option } from 'prelude-ts'
import { Result } from 'neverthrow'

export type AddressT = JSONEncodable &
	DSONCodable &
	Readonly<{
		publicKey: PublicKey
		magicByte: Byte
		toString: () => string
		equals: (other: AddressT) => boolean
	}>

export type AccountIdFromBIP32Path = Readonly<{
	type: 'AccountIdFromBIP32Path'
	accountIdString: string
}>

export type AccountIdFromPublicKey = Readonly<{
	type: 'AccountIdFromPublicKey'
	accountIdString: string
}>
export type AccountIdT = AccountIdFromBIP32Path | AccountIdFromPublicKey

export type PublicKeyDeriving = Readonly<{
	derivePublicKey: () => Observable<PublicKey>
}>

export type Signing = Readonly<{
	sign: (unsignedMessage: UnsignedMessage) => Observable<Signature>
}>

export type AccountT = PublicKeyDeriving &
	Signing &
	Readonly<{
		accountId: AccountIdT
	}>

/// A simple "interface" like type that this `account` package recognizes.
/// The `hardware-wallet` package will mark its type being this type +
/// additional decoration. We want the `hardware-wallet` package to be
/// dependent on this package, not the other way around, thus we need
/// some kind of simple "interface" like type here.
export type HardwareWalletSimpleT = Readonly<{
	derivePublicKey: (hdPath: BIP32T) => Observable<PublicKey>
	sign: (
		input: Readonly<{
			unsignedMessage: UnsignedMessage
			hdPath: BIP32T
		}>,
	) => Observable<Signature>
}>

export type AccountsT = Readonly<{
	get: (id: AccountIdT | PublicKey | BIP32T) => Option<AccountT>
	all: AccountT[]
}>

export type WalletT = PublicKeyDeriving &
	Signing &
	Readonly<{
		changeAccount: (to: AccountT) => Result<ValidationWitness, Error>
		addAccount: (newAccount: AccountT) => Result<ValidationWitness, Error>
		addAccountByPrivateKey: (
			privateKey: PrivateKey,
		) => Result<ValidationWitness, Error>
		observeActiveAccount: () => Observable<AccountT>
		observeAccounts: () => Observable<AccountsT>
	}>
