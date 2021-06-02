import { LedgerButtonPress, PromptUserForInput } from './emulatedLedger'

export enum LedgerInstruction {
	GET_VERSION = 0x03,
	GET_APP_NAME = 0x04,
	GET_PUBLIC_KEY = 0x05,
	DO_SIGN_TX = 0x06,
	DO_SIGN_HASH = 0x07,
	DO_KEY_EXCHANGE = 0x08,
}

/// Keep in sync with: https://github.com/radixdlt/app-radix/blob/main/src/sw.h
export enum LedgerResponseCodes {
	/// Status word for success.
	SW_OK = 0x9000,

	// Status word for denied by user.
	SW_DENY = 0x6985,

	/// Status word for incorrect P1 or P2.
	SW_WRONG_P1P2 = 0x6a86,

	/// Status word for either wrong Lc or lenght of APDU command less than 5.
	SW_WRONG_DATA_LENGTH = 0x6a87,

	/// Status word for unknown command with this INS.
	SW_INS_NOT_SUPPORTED = 0x6d00,

	/// Status word for instruction class is different than CLA.
	SW_CLA_NOT_SUPPORTED = 0x6e00,

	/// Status word for wrong reponse length (buffer too small or too big).
	SW_WRONG_RESPONSE_LENGTH = 0xb000,

	/// Status word for fail to display BIP32 path.
	SW_DISPLAY_BIP32_PATH_FAIL = 0xb001,

	/// Status word for fail to display address.
	SW_DISPLAY_ADDRESS_FAIL = 0xb002,

	/// Status word for fail to display amount.
	SW_DISPLAY_AMOUNT_FAIL = 0xb003,

	/// Status word for wrong transaction length.
	SW_WRONG_TX_LENGTH = 0xb004,

	/// Status word for fail of transaction parsing.
	SW_TX_PARSING_FAIL = 0xb005,

	/// Status word for fail of transaction hash.
	SW_TX_HASH_FAIL = 0xb006,

	/// Status word for bad state.
	SW_BAD_STATE = 0xb007,

	/// Status word for signature fail.
	SW_SIGNATURE_FAIL = 0xb008,
}

export const prettifyLedgerResponseCode = (code: LedgerResponseCodes): string =>
	`${code === LedgerResponseCodes.SW_OK ? '✅' : '❌'} code: '${
		LedgerResponseCodes[code]
	}' 0x${code.toString(16)} (0d${code.toString(10)})`

import { Observable, Subject } from 'rxjs'

export type CreateLedgerNanoTransportInput = Readonly<{
	openTimeout?: number
	listenTimeout?: number
}>

export const radixCLA: number = 0xaa

export type APDUT = Readonly<{
	// (type: 'number') Always to '0xAA'
	cla: number
	ins: number

	//  Will default to `0` if undefined
	p1: number

	// Should not be present if `p1` is 'undefined'. Will default to `0` if undefined
	p2: number

	// defaults to zero length buffer
	data?: Buffer

	// defaults to: `[SW_OK]`
	requiredResponseStatusCodeFromDevice: LedgerResponseCodes[]
}>

export type PartialAPDUT = Omit<
	APDUT,
	'p1' | 'p2' | 'requiredResponseStatusCodeFromDevice'
> &
	Readonly<{
		p1?: number

		// Should not be present if `p1` is 'undefined'. Will default to `0` if undefined
		p2?: number

		// defaults to: `[SW_OK]`
		requiredResponseStatusCodeFromDevice?: LedgerResponseCodes[]
	}>

export type RadixAPDUT = APDUT &
	Readonly<{
		cla: typeof radixCLA
		ins: LedgerInstruction
	}>

export type LedgerRequest = Readonly<{
	apdu: RadixAPDUT
	uuid: string
}>

export type LedgerResponse = Readonly<{
	data: Buffer
	uuid: string // should match one of request.
}>

export type LedgerNanoT = Readonly<{
	close: () => Observable<void>
	sendAPDUToDevice: (apdu: RadixAPDUT) => Observable<Buffer>
	__sendRequestToDevice: (
		request: LedgerRequest,
	) => Observable<LedgerResponse>
}>

export type RequestAndResponse = Readonly<{
	apdu: RadixAPDUT
	response: LedgerResponse
}>

export type UserOutputAndInput = Readonly<{
	toUser: PromptUserForInput
	fromUser: LedgerButtonPress
}>

export type MockedLedgerNanoStoreT = Readonly<{
	// IO between GUI wallet and Ledger Nano
	recorded: RequestAndResponse[]
	lastRnR: () => RequestAndResponse
	lastRequest: () => RadixAPDUT
	lastResponse: () => LedgerResponse

	// Input from user using buttons and output to user on display
	userIO: UserOutputAndInput[]
	lastUserInput: () => LedgerButtonPress
	lastPromptToUser: () => PromptUserForInput
}>

export type EmulatedLedgerIO = Readonly<{
	usersInputOnLedger: Subject<LedgerButtonPress>
	promptUserForInputOnLedger: Subject<PromptUserForInput>
}>

export type MockedLedgerNanoRecorderT = MockedLedgerNanoStoreT &
	EmulatedLedgerIO &
	Readonly<{
		recordRequest: (request: LedgerRequest) => void
		recordResponse: (response: LedgerResponse) => RequestAndResponse
	}>

export type MockedLedgerNanoT = LedgerNanoT &
	Readonly<{
		store: MockedLedgerNanoStoreT
	}>
