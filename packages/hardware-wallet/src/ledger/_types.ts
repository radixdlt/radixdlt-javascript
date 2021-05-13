import { Observable, Subject } from 'rxjs'
import { LedgerInstruction, LedgerResponseCodes } from '../_types'
import { LedgerButtonPress, PromptUserForInput } from './emulatedLedger'

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
