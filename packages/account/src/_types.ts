import { Observable } from 'rxjs'
import { Option } from 'prelude-ts'
import {
	BIP32T,
	DiffieHellman,
	ECPointOnCurveT,
	EncryptedMessageT,
	HDPathRadixT,
	MnemomicT,
	PrivateKeyT,
	PublicKeyT,
	SignatureT,
} from '@radixdlt/crypto'

/* A reactive counterpart of `Signer` in '@radixdlt/crypto' package  */
export type Signing = Readonly<{
	sign: (hashedMessage: Buffer) => Observable<SignatureT>
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

export type SigningKeyT = Signing &
	Encrypting &
	Decrypting &
	Readonly<{
		// useful for testing.
		__diffieHellman: DiffieHellman

		// Type of signingKey: `SigningKeyTypeHDT` or `SigningKeyTypeNonHDT`, where HD has `hdSigningKeyType` which can be `LOCAL` or `HARDWARE_OR_REMOTE` (e.g. Ledger Nano)
		type: SigningKeyTypeT
		publicKey: PublicKeyT

		// sugar for `type.uniqueKey`
		uniqueIdentifier: string

		// Useful for debugging.
		toString: () => string

		// Sugar for thisSigningKey.publicKey.equals(other.publicKey)
		equals: (other: SigningKeyT) => boolean

		// Sugar for `type.hdPath`, iff, type.typeIdentifier === SigningKeyTypeHDT
		hdPath?: HDPathRadixT

		// Sugar for `type.isHDSigningKey`
		isHDSigningKey: boolean
		// Sugar for `type.isHardwareSigningKey`
		isHardwareSigningKey: boolean
		// Sugar for `isHDSigningKey && !isHardwareSigningKey`
		isLocalHDSigningKey: boolean
	}>

// Used by `hardware-wallet` package
export type HardwareSigningKeyT = Readonly<{
	diffieHellman: (
		input: Readonly<{
			hdPath: BIP32T
			publicKeyOfOtherParty: PublicKeyT
		}>,
	) => Observable<ECPointOnCurveT>
	derivePublicKey: (hdPath: BIP32T) => Observable<PublicKeyT>
	sign: (
		input: Readonly<{
			hashedMessage: Buffer
			hdPath: BIP32T
		}>,
	) => Observable<SignatureT>
}>

export type SigningKeysT = Readonly<{
	toString: () => string
	equals: (other: SigningKeysT) => boolean

	// Get only HD signingKey, by its path
	getHDSigningKeyByHDPath: (hdPath: HDPathRadixT) => Option<SigningKeyT>
	// Get any signingKey by its public key
	getAnySigningKeyByPublicKey: (publicKey: PublicKeyT) => Option<SigningKeyT>

	all: SigningKeyT[]

	hdSigningKeys: () => SigningKeyT[]
	localHDSigningKeys: () => SigningKeyT[]
	hardwareHDSigningKeys: () => SigningKeyT[]
	nonHDSigningKeys: () => SigningKeyT[]

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

export type SigningKeychainT = Signing &
	Readonly<{
		// should only be used for testing
		__unsafeGetSigningKey: () => SigningKeyT

		revealMnemonic: () => MnemomicT

		restoreLocalHDSigningKeysUpToIndex: (
			index: number,
		) => Observable<SigningKeysT>

		deriveNextLocalHDSigningKey: (
			input?: DeriveNextInput,
		) => Observable<SigningKeyT>

		addSigningKeyFromPrivateKey: (
			input: AddSigningKeyByPrivateKeyInput,
		) => SigningKeyT

		switchSigningKey: (input: SwitchSigningKeyInput) => SigningKeyT

		observeActiveSigningKey: () => Observable<SigningKeyT>
		observeSigningKeys: () => Observable<SigningKeysT>
	}>
