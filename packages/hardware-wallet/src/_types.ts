import { HDPathRadixT } from '@radixdlt/account'
import { Observable } from 'rxjs'
import { ECPointOnCurve, PublicKey, Signature } from '@radixdlt/crypto'

// Semantic versioning, e.g. 1.0.5
export type SemVer = Readonly<{
	major: number
	minor: number
	patch: number
}>

export type AtPath = Readonly<{
	// defaults to: `m/44'/536'/0'/0/0`
	path?: HDPathRadixT
}>

export type SignInput = AtPath &
	Readonly<{
		hash: Buffer
	}>

export type KeyExchangeInput = AtPath &
	Readonly<{
		publicKeyOfOtherParty: PublicKey
	}>

export enum HardwareWalletDeviceConnectionStatus {
	DISCONNECTED_DEVICE_NOT_CONNECTED = 'DISCONNECTED_DEVICE_NOT_CONNECTED',
	DISCONNECTED_BECAUSE_APP_NOT_OPENED = 'DISCONNECTED_BECAUSE_APP_NOT_OPENED',
	// Device connected and app opened
	CONNECTED = 'CONNECTED',
}

export type HardwareWalletT = Readonly<{
	deviceConnectionStatus: Observable<HardwareWalletDeviceConnectionStatus>
	getVersion: () => Observable<SemVer>
	getPublicKey: (input: AtPath) => Observable<PublicKey>
	doSign: (input: SignInput) => Observable<Signature>
	doKeyExchange: (input: KeyExchangeInput) => Observable<ECPointOnCurve>
}>

export enum LedgerInstruction {
	GET_VERSION = 0x00,
	GET_PUBLIC_KEY = 0x01,
	DO_KEY_EXCHANGE = 0x02,
	DO_SIGN_HASH = 0x03,
}
