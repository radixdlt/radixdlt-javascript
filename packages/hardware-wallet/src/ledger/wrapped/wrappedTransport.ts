import {
	LedgerDeviceTransport,
	WLTClose,
	WLTDecorateAppAPIMethods,
	WLTExchange,
	WLTOnOff,
	WLTSend,
	WLTSetDebugMode,
	WLTSetExchangeTimeout,
	WLTSetScrambleKey,
	WrappedLedgerTransportInput,
	WrappedLedgerTransportT,
} from './_types'
import { firstValueFrom, Observable } from 'rxjs'
import { HDMasterSeed, MnemomicT } from '@radixdlt/account'
import { emulateSend } from './emulatedLedger'
import { SemVerT } from '../../_types'
import { SemVer } from '../semVer'

/* eslint-disable @typescript-eslint/no-explicit-any */

const create = (
	input?: WrappedLedgerTransportInput,
): WrappedLedgerTransportT => {
	const exchange: WLTExchange =
		input?.exchange ??
		((_) => Promise.reject(`Method 'exchange' is not implemented`))
	const setScrambleKey: WLTSetScrambleKey =
		input?.setScrambleKey ??
		((_) => {
			throw new Error(`Method 'setScrambleKey' is not implemented`)
		})
	const close: WLTClose =
		input?.close ??
		(() => Promise.reject(`Method 'close' is not implemented`))
	const on: WLTOnOff =
		input?.on ??
		((_1, _2) => {
			throw new Error(`Method 'on' is not implemented`)
		})
	const off: WLTOnOff =
		input?.off ??
		((_1, _2) => {
			throw new Error(`Method 'off' is not implemented`)
		})
	const setDebugMode: WLTSetDebugMode =
		input?.setDebugMode ??
		((_) => {
			throw new Error(`Method 'setDebugMode' is not implemented`)
		})
	const setExchangeTimeout: WLTSetExchangeTimeout =
		input?.setExchangeTimeout ??
		((_) => {
			throw new Error(`Method 'setExchangeTimeout' is not implemented`)
		})
	const send: WLTSend =
		input?.send ??
		((_1, _2, _3, _4, _5, _6) =>
			Promise.reject(`Method 'send' is not implemented`))
	const decorateAppAPIMethods: WLTDecorateAppAPIMethods =
		input?.decorateAppAPIMethods ??
		((_1, _2, _3) => {
			throw new Error(`Method 'decorateAppAPIMethods' is not implemented`)
		})

	return {
		exchange,
		setScrambleKey,
		close,
		on,
		off,
		setDebugMode,
		setExchangeTimeout,
		send,
		decorateAppAPIMethods,
	}
}

const mock = (
	input: Omit<WrappedLedgerTransportInput, 'exchange' | 'close' | 'send'> &
		Readonly<{
			exchange?: (apdu: Buffer) => Observable<Buffer>
			close?: () => Observable<void>
			send?: (
				cla: number,
				ins: number,
				p1: number,
				p2: number,
				data?: Buffer,
				statusList?: ReadonlyArray<number>,
			) => Observable<Buffer>
		}>,
): WrappedLedgerTransportT => {
	return create({
		...input,
		exchange:
			input.exchange !== undefined
				? (apdu): Promise<Buffer> =>
						firstValueFrom(input.exchange!(apdu))
				: undefined,

		close:
			input.close !== undefined
				? (): Promise<void> => firstValueFrom(input.close!())
				: undefined,

		send:
			input.send !== undefined
				? (c, i, p1, p2, d, s): Promise<Buffer> =>
						firstValueFrom(input.send!(c, i, p1, p2, d, s))
				: undefined,
	})
}

const from = (transport: LedgerDeviceTransport): WrappedLedgerTransportT => {
	return create({ ...transport })
}

const emulate = (
	input: Readonly<{
		mnemonic: MnemomicT
		passphrase?: string
		version?: SemVerT
	}>,
): WrappedLedgerTransportT => {
	const masterSeed = HDMasterSeed.fromMnemonic(input)
	const hdMasterNode = masterSeed.masterNode()
	const hardcodedVersion =
		input.version ?? SemVer.create({ major: 1, minor: 2, patch: 3 })

	return create({
		send: emulateSend({ hdMasterNode, hardcodedVersion }),
	})
}

export const WrappedLedgerTransport = {
	mock,
	emulate,
	from,
}

/* eslint-enable @typescript-eslint/no-explicit-any */
