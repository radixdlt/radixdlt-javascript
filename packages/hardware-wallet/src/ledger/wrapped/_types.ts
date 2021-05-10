import Transport from '@ledgerhq/hw-transport'
import { LedgerResponseCodes } from '../../_types'

export type LedgerDeviceTransport = Transport<'Ledger'>

/* eslint-disable @typescript-eslint/no-explicit-any */

export type WLTExchange = (apdu: Buffer) => Promise<Buffer>
export type WLTSetScrambleKey = (key: string) => void
export type WLTClose = () => Promise<void>
export type WLTOnOff = (eventName: string, cb: any) => void
export type WLTSetDebugMode = (debug: boolean | ((log: string) => void)) => void
export type WLTSetExchangeTimeout = (exchangeTimeout: number) => void

export type WLTSendAPDU = Readonly<{
	cla: number
	ins: number
	p1: number
	p2: number
	data?: Buffer
	statusList?: ReadonlyArray<number>
}>
export type WLTSend = (
	cla: number,
	ins: number,
	p1: number,
	p2: number,
	data?: Buffer,
	statusList?: ReadonlyArray<number>,
) => Promise<Buffer>
export type WLTDecorateAppAPIMethods = (
	self: any,
	methods: string[],
	scrambleKey: string,
) => void

export type WrappedLedgerTransportT = Readonly<{
	exchange: WLTExchange
	setScrambleKey: WLTSetScrambleKey
	close: WLTClose
	on: WLTOnOff
	off: WLTOnOff
	setDebugMode: WLTSetDebugMode
	setExchangeTimeout: WLTSetExchangeTimeout
	send: WLTSend
	decorateAppAPIMethods: WLTDecorateAppAPIMethods
}>

export type WrappedLedgerTransportInput = Readonly<{
	exchange?: WLTExchange
	setScrambleKey?: WLTSetScrambleKey
	close?: WLTClose
	on?: WLTOnOff
	off?: WLTOnOff
	setDebugMode?: WLTSetDebugMode
	setExchangeTimeout?: WLTSetExchangeTimeout
	send?: WLTSend
	decorateAppAPIMethods?: WLTDecorateAppAPIMethods
}>

/* eslint-enable @typescript-eslint/no-explicit-any */

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
