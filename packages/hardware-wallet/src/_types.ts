import { HDPathRadixT } from '@radixdlt/account'
import { Observable } from 'rxjs'
import { ECPointOnCurveT, PublicKey, Signature } from '@radixdlt/crypto'

// Semantic versioning, e.g. 1.0.5
export type SemVerT = Readonly<{
	major: number
	minor: number
	patch: number

	// '{major}.{minor}.{patch}'
	toString: () => string
}>

export type AtPath = Readonly<{
	// defaults to: `m/44'/536'/0'/0/0`
	path?: HDPathRadixT
}>

export type SignInput = AtPath &
	Readonly<{
		hash: Buffer
	}>

export type GetPublicKeyInput = AtPath &
	Readonly<{
		requireConfirmationOnDevice?: boolean
	}>

export type KeyExchangeInput = GetPublicKeyInput &
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
	getVersion: () => Observable<SemVerT>
	getPublicKey: (input: GetPublicKeyInput) => Observable<PublicKey>
	doSign: (input: SignInput) => Observable<Signature>
	doKeyExchange: (input: KeyExchangeInput) => Observable<ECPointOnCurveT>
}>

export enum LedgerInstruction {
	GET_VERSION = 0x00,
	DO_KEY_EXCHANGE = 0x04,
	GET_PUBLIC_KEY = 0x08,
}

// https://github.com/radixdlt/radixdlt-ledger-app/blob/2eecabd2d870ebc252218d91034a767320b71487/app/src/common/common_macros.h#L37-L43
export enum LedgerResponseCodes {
	SW_USER_REJECTED = 0x6985,
	SW_INVALID_MAC_CODE = 0x6986,
	SW_FATAL_ERROR_INCORRECT_IMPLEMENTATION = 0x6b00,
	SW_INVALID_PARAM = 0x6b01,
	SW_INVALID_INSTRUCTION = 0x6d00,
	SW_INCORRECT_CLA = 0x6e00,
	SW_OK = 0x9000,
}
