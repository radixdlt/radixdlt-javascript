import { Observable } from 'rxjs'
import {
	ECPointOnCurveT,
	HDPathRadixT,
	PublicKeyT,
	SignatureT,
} from '@radixdlt/crypto'
import { BuiltTransactionReadyToSign, NetworkT } from '@radixdlt/primitives'

// Semantic versioning, e.g. 1.0.5
export type SemVerT = Readonly<{
	major: number
	minor: number
	patch: number

	equals: (other: SemVerT) => boolean

	// '{major}.{minor}.{patch}'
	toString: () => string
}>

export type AtPath = Readonly<{
	// defaults to: `m/44'/536'/0'/0/0`
	path?: HDPathRadixT
}>

export type GetPublicKeyInput = AtPath &
	Readonly<{
		displayAddress?: boolean
		// verifyAddressOnDeviceForNetwork?: NetworkT
	}>

export type SignTransactionInput = AtPath &
	Readonly<{
		nonNativeTokenRriHRP?: string
		tx: BuiltTransactionReadyToSign
	}>

export type SignTXOutput = Readonly<{
	signature: SignatureT
	signatureV: number
	hashCalculatedByLedger: Buffer
}>

export type SignHashInput = GetPublicKeyInput &
	Readonly<{
		hashToSign: Buffer
	}>

export type KeyExchangeInput = AtPath &
	Readonly<{
		publicKeyOfOtherParty: PublicKeyT
		displayBIPAndPubKeyOtherParty: boolean
	}>

export type HardwareSigningKeyT = Readonly<{
	keyExchange: (
		publicKeyOfOtherParty: PublicKeyT,
	) => Observable<ECPointOnCurveT>
	publicKey: PublicKeyT
	sign: (hashedMessage: Buffer) => Observable<SignatureT>
}>

export type HardwareWalletT = Readonly<{
	getVersion: () => Observable<SemVerT>
	getPublicKey: (input: GetPublicKeyInput) => Observable<PublicKeyT>
	doSignHash: (input: SignHashInput) => Observable<SignatureT>
	doSignTransaction: (input: SignTransactionInput) => Observable<SignTXOutput>
	doKeyExchange: (input: KeyExchangeInput) => Observable<ECPointOnCurveT>

	makeSigningKey: (path: HDPathRadixT) => Observable<HardwareSigningKeyT>
}>
