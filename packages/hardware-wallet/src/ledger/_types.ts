import { from, Observable } from 'rxjs'

export enum DeviceResponseStatusCode {
	OK = 0x9000,
}

export type APDUT = Readonly<{
	// (type: 'number') Always to '0xAA'
	cla: number
	ins: number

	//  Will default to `0` if undefined
	p1?: number

	// Should not be present if `p1` is 'undefined'. Will default to `0` if undefined
	p2?: number

	// defaults to zero length buffer
	data?: Buffer

	// defaults to: `[]`
	requiredResponseStatusCodeFromDevice?: DeviceResponseStatusCode[]
}>

export type RadixAPDUT = APDUT &
	Readonly<{
		// (type: 'number') Always to '0xAA'
		cla: 0xaa
		ins: LedgerInstruction
	}>


// Wrapper for this: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/ledgerhq__hw-transport/index.d.ts
export type LedgerNanoTransportT = Readonly<{
	// Wrapper for `send`: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/ledgerhq__hw-transport/index.d.ts#L23-L36

	/**
	 * A wrapper around exchange to simplify work of the implementation.
	 *
	 * @param apdu.data The data to be sent. Defaults to a zero-length Buffer.
	 * @param apdu.statusList A list of accepted status code (shorts). [0x9000] by default.
	 * @returns A Promise of the response Buffer
	 */
	sendAPDUCommandToDevice: (
		input: Readonly<{
			apdu: APDUT
		}>,
	) => Promise<Buffer>
}>

export type LedgerNanoT = Readonly<{
	sendAPDUCommandToDevice: (
		input: Readonly<{
			apdu: RadixAPDUT
		}>,
	) => Observable<Buffer>
}>


import { LedgerInstruction } from '../_types'

export type CreateLedgerNanoTransportInput = Readonly<{
	openTimeout?: number
	listenTimeout?: number
}>

