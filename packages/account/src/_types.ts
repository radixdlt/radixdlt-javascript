import { DSONCodable, JSONEncodable } from '@radixdlt/data-formats'
import { Byte } from '@radixdlt/util'
import { PublicKey, Signature, UnsignedMessage } from '@radixdlt/crypto'
import { Observable } from 'rxjs'
import { BIP32T } from './bip32/_types'
import { Option } from 'prelude-ts'
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

export enum EncryptionSchemeName {
	DO_NOT_ENCRYPT = 'DO_NOT_ENCRYPT',
}

export type MessageEncryption = Readonly<{
	encryptionScheme: EncryptionSchemeName
}>

export type PlaintextMessageToEncrypt = MessageEncryption &
	Readonly<{
		plaintext: string
		publicKeysOfReaders: PublicKey[]
	}>

export type EncryptedMessage = MessageEncryption &
	Readonly<{
		/* hex string of encrypted message buffer `(Cipher | Ephemeral Shared Secret | Nonce | Tag )` */
		msg: string
	}>

export type EncryptedMessageToDecrypt = EncryptedMessage &
	Readonly<{
		publicKeysOfReaders: PublicKey[]
	}>

export type Signing = Readonly<{
	sign: (unsignedMessage: UnsignedMessage) => Observable<Signature>
}>

export type Decrypting = Readonly<{
	decrypt: (encryptedMessage: EncryptedMessageToDecrypt) => Observable<string>
}>

export type Encrypting = Readonly<{
	encrypt: (
		plaintext: PlaintextMessageToEncrypt,
	) => Observable<EncryptedMessage>
}>

export type AccountT = PublicKeyDeriving &
	Signing &
	Encrypting &
	Decrypting &
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

		// Call this once you can provide an observable providing magic.
		provideNetworkId: (magic: Observable<Magic>) => void
		deriveNext: (input?: DeriveNextAccountInput) => AccountT

		switchAccount: (input: SwitchAccountInput) => AccountT

		observeActiveAccount: () => Observable<AccountT>
		observeActiveAddress: () => Observable<AddressT>
		observeAccounts: () => Observable<AccountsT>
	}>
