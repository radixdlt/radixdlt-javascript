import { Observable } from 'rxjs'
import { LedgerInstruction, LedgerResponseCodes } from '../_types'
import { APDUT } from './wrapped'

export type CreateLedgerNanoTransportInput = Readonly<{
	openTimeout?: number
	listenTimeout?: number
}>

export const radixCLA: number = 0xaa

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
		// (type: 'number') Always to '0xAA'
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

export type MockedLedgerNanoStoreT = Readonly<{
	recorded: RequestAndResponse[]
	lastRnR: () => RequestAndResponse
	lastRequest: () => RadixAPDUT
	lastResponse: () => LedgerResponse
}>

export type MockedLedgerNanoRecorderT = MockedLedgerNanoStoreT & {
	recordRequest: (request: LedgerRequest) => void
	recordResponse: (response: LedgerResponse) => RequestAndResponse
}

export type MockedLedgerNanoT = LedgerNanoT &
	Readonly<{
		store: MockedLedgerNanoStoreT
	}>
