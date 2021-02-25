import { DSONCodable, JSONEncodable } from '@radixdlt/data-formats'
import { Byte } from '@radixdlt/util'
import {
	PrivateKey,
	PublicKey,
	Signature,
	UnsignedMessage,
} from '@radixdlt/crypto'
import { Observable } from 'rxjs'
import { BIP32T } from './bip32/_types'

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

export type HardwareWallet = Readonly<{
	derivePublicKey: (hdPath: BIP32T) => Observable<PublicKey>
	sign: (
		input: Readonly<{
			unsignedMessage: UnsignedMessage
			hdPath: BIP32T
		}>,
	) => Observable<Signature>
}>

export type Maybe<T> = T | undefined

export type AccountsT = Readonly<{
	get: (id: AccountIdT | PublicKey | BIP32T) => Maybe<AccountT>
	all: AccountT[]
}>

export type WalletT = PublicKeyDeriving &
	Signing &
	Readonly<{
		changeAccount: (to: AccountT) => void
		addAccount: (newAccount: AccountT) => void
		addAccountByPrivateKey: (privateKey: PrivateKey) => void
		observeActiveAccount: () => Observable<AccountT>
		observeAccounts: () => Observable<AccountsT>
	}>
