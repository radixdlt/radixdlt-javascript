import { DSONCodable, JSONEncodable } from '@radixdlt/data-formats'
import { Byte } from '@radixdlt/util'
import { PublicKey, Signature, UnsignedMessage } from '@radixdlt/crypto'
import { Observable } from 'rxjs'
import { BIP32T } from './bip32/_types'
import { Option } from 'prelude-ts'
import { HDMasterSeedT } from './_index'
import { HDPathRadixT } from './bip32/_index'
import { Magic } from '@radixdlt/primitives'

export type AddressT = JSONEncodable &
	DSONCodable &
	Readonly<{
		publicKey: PublicKey
		magicByte: Byte
		toString: () => string
		equals: (other: AddressT) => boolean
	}>

export type PublicKeyDeriving = Readonly<{
	derivePublicKey: () => Observable<PublicKey>
}>

export type Signing = Readonly<{
	sign: (unsignedMessage: UnsignedMessage) => Observable<Signature>
}>

export type AccountT = PublicKeyDeriving &
	Signing &
	Readonly<{
		hdPath: HDPathRadixT
		deriveAddress: () => Observable<AddressT>
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
	get: (hdPath: HDPathRadixT) => Option<AccountT>
	all: AccountT[]
}>

export type MasterSeedProviderT = Readonly<{
	masterSeed: () => Observable<HDMasterSeedT>
}>

export enum AccountIndexPosition {
	FIRST,
	LAST, // last known/derived
}

export type TargetAccountIndexT = number | AccountIndexPosition

export type WalletT = PublicKeyDeriving &
	Signing &
	Readonly<{
		// Call this once you can provide an observable providing magic.
		provideMagic: (magic: Observable<Magic>) => void
		deriveNext: (
			input?: Readonly<{
				isHardened?: boolean // defaults to true
				alsoSwitchTo?: boolean // defaults to false
			}>,
		) => AccountT

		switchAccount: (
			input: Readonly<{ to: AccountT | TargetAccountIndexT }>,
		) => AccountT

		observeActiveAccount: () => Observable<AccountT>
		observeActiveAddress: () => Observable<AddressT>
		observeAccounts: () => Observable<AccountsT>
	}>
