import { Observable } from 'rxjs'
import {
	ECPointOnCurveT,
	HDPathRadixT,
	PublicKeyT,
	SignatureT,
} from '@radixdlt/crypto'

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
		requireConfirmationOnDevice?: boolean
	}>

export type SignHashInput = GetPublicKeyInput &
	Readonly<{
		hashToSign: Buffer
	}>

export type KeyExchangeInput = GetPublicKeyInput &
	Readonly<{
		publicKeyOfOtherParty: PublicKeyT
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
	doKeyExchange: (input: KeyExchangeInput) => Observable<ECPointOnCurveT>

	makeSigningKey: (path: HDPathRadixT) => Observable<HardwareSigningKeyT>
}>

export enum LedgerInstruction {
	PING = 0x00,
	GET_VERSION = 0x01,
	GET_PUBLIC_KEY = 0x02,
	DO_KEY_EXCHANGE = 0x04,
	DO_SIGN_HASH = 0x08,
	DO_SIGN_TX = 0x16,
}

// https://github.com/radixdlt/radixdlt-ledger-app/blob/2eecabd2d870ebc252218d91034a767320b71487/app/src/common/common_macros.h#L37-L43
export enum LedgerResponseCodes {
	CLA_NOT_SUPPORTED = 0x6e00,

	SW_USER_REJECTED = 0x6985,
	SW_INVALID_MAC_CODE = 0x6986,
	SW_FATAL_ERROR_INCORRECT_IMPLEMENTATION = 0x6b00,
	SW_INVALID_PARAM = 0x6b01,
	SW_INVALID_INSTRUCTION = 0x6d00,
	SW_OK = 0x9000,
}
export const prettifyLedgerResponseCode = (code: LedgerResponseCodes): string =>
	`${code === LedgerResponseCodes.SW_OK ? '✅' : '❌'} code: '${
		LedgerResponseCodes[code]
	}' 0x${code.toString(16)} (0d${code.toString(10)})`
