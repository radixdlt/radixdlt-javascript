import { DSONCodable, JSONEncodable } from '@radixdlt/data-formats'
import { Byte } from '@radixdlt/util'
import {
	PrivateKey,
	PublicKey,
	Signature,
	UnsignedMessage,
} from '@radixdlt/crypto'
import { Observable } from 'rxjs'

export type Address = JSONEncodable &
	DSONCodable &
	Readonly<{
		publicKey: PublicKey
		magicByte: Byte
		toString: () => string
		equals: (other: Address) => boolean
	}>

export type AccountIdFromBIP32Path = Readonly<{
	type: 'AccountIdFromBIP32Path'
	accountIdString: string
}>
/// Case of private key present => can directly derive public key => hashit, used as accountId
export type AccountIdFromPublicKey = Readonly<{
	type: 'AccountIdFromPublicKey'
	accountIdString: string
}>
export type AccountID = AccountIdFromBIP32Path | AccountIdFromPublicKey

export type PublicKeyDeriving = Readonly<{
	derivePublicKey: () => Observable<PublicKey>
}>

export type Signing = Readonly<{
	sign: (unsignedMessage: UnsignedMessage) => Observable<Signature>
}>

export type AccountT = PublicKeyDeriving &
	Signing &
	Readonly<{
		accountId: AccountID
	}>

export type BIP32 = Readonly<{
	toString: () => string
}>

export type HardwareWallet = Readonly<{
	derivePublicKey: (hdPath: BIP32) => Observable<PublicKey>
	sign: (
		input: Readonly<{
			unsignedMessage: UnsignedMessage
			hdPath: BIP32
		}>,
	) => Observable<Signature>
}>

export type WalletT = PublicKeyDeriving &
	Signing &
	Readonly<{
		changeAccount: (to: AccountT) => void
		addAccount: (newAccount: AccountT) => void
		addAccountByPrivateKey: (privateKey: PrivateKey) => void
		observeActiveAccount: () => Observable<AccountT>
		observeAccounts: () => Observable<Map<AccountID, AccountT>>
	}>
