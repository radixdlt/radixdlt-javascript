import { Observable } from 'rxjs'
import { Option } from 'prelude-ts'
import {
	DiffieHellman,
	EncryptedMessageT,
	HDPathRadixT,
	MnemomicT,
	PrivateKeyT,
	PublicKeyT,
	SignatureT,
} from '@radixdlt/crypto'
import { HardwareWalletT } from '@radixdlt/hardware-wallet'
import { BuiltTransactionReadyToSign } from '@radixdlt/primitives'
import { SigningKeychain } from './keychain'
import { SigningKey, SigningKeyT } from './keypair'

export type Signing = Readonly<{
	signHash: (hashedMessage: Buffer) => Observable<SignatureT>
	sign: (
		tx: BuiltTransactionReadyToSign,
		nonXrdHRP?: string,
	) => Observable<SignatureT>
}>

export type SigningKeyEncryptionInput = Readonly<{
	plaintext: Buffer | string
	publicKeyOfOtherParty: PublicKeyT
}>

export type Encrypting = Readonly<{
	encrypt: (input: SigningKeyEncryptionInput) => Observable<EncryptedMessageT>
}>

export type SigningKeyDecryptionInput = Readonly<{
	encryptedMessage: Buffer | EncryptedMessageT
	publicKeyOfOtherParty: PublicKeyT
}>

export type Decrypting = Readonly<{
	decrypt: (input: SigningKeyDecryptionInput) => Observable<string>
}>

export enum HDSigningKeyTypeIdentifier {
	LOCAL = 'LOCAL',
	HARDWARE_OR_REMOTE = 'HARDWARE_OR_REMOTE',
}

export enum SigningKeyTypeIdentifier {
	HD_SIGNING_KEY = 'HD_SIGNING_KEY',
	NON_HD_SIGNING_KEY = 'NON_HD_SIGNING_KEY',
}

export type BaseSigningKeyTypeT<T extends SigningKeyTypeIdentifier> = Readonly<{
	typeIdentifier: T
	isHDSigningKey: boolean
	isHardwareSigningKey: boolean
	uniqueKey: string
}>

export type SigningKeyTypeHDT = BaseSigningKeyTypeT<SigningKeyTypeIdentifier.HD_SIGNING_KEY> &
	Readonly<{
		hdSigningKeyType: HDSigningKeyTypeIdentifier
		hdPath: HDPathRadixT
	}>

export type SigningKeyTypeNonHDT = BaseSigningKeyTypeT<SigningKeyTypeIdentifier.NON_HD_SIGNING_KEY> &
	Readonly<{
		name?: string
	}>

export type SigningKeyTypeT = SigningKeyTypeHDT | SigningKeyTypeNonHDT

export type PrivateKeyToSigningKeyInput = Readonly<{
	privateKey: PrivateKeyT
	name?: string
}>

export type HWSigningKeyDerivation = 'next' | HDPathRadixT
export type DeriveHWSigningKeyInput = Readonly<{
	keyDerivation: HWSigningKeyDerivation
	hardwareWalletConnection: Observable<HardwareWalletT>
	alsoSwitchTo: boolean
	verificationPrompt?: boolean
}>

export type SigningKeysT = Readonly<{
	toString: () => string
	all: SigningKeyT[]
	// Get only HD signingKey, by its path
	getHDSigningKeyByHDPath: (hdPath: HDPathRadixT) => Option<SigningKeyT>
	// Get any signingKey by its public key
	getAnySigningKeyByPublicKey: (publicKey: PublicKeyT) => Option<SigningKeyT>

	// size of `all.
	size: () => number
}>

export type SwitchToSigningKey = Readonly<{ toSigningKey: SigningKeyT }>
export type SwitchToIndex = Readonly<{ toIndex: number }>

export type SwitchSigningKeyInput =
	| 'first'
	| 'last'
	| SwitchToSigningKey
	| SwitchToIndex

export type DeriveNextInput =
	| undefined
	| Readonly<{
			isHardened?: boolean // defaults to true
			alsoSwitchTo?: boolean // defaults to false
	  }>

export type AddSigningKeyByPrivateKeyInput = PrivateKeyToSigningKeyInput & {
	alsoSwitchTo?: boolean
}

export type SigningKeychainT = ReturnType<typeof SigningKeychain.create>
