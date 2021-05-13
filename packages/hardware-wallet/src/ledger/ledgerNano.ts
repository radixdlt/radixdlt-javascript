import {
	LedgerNanoT,
	LedgerRequest,
	LedgerResponse,
	MockedLedgerNanoRecorderT,
	MockedLedgerNanoT,
	RadixAPDUT,
} from './_types'
import { Observable, throwError } from 'rxjs'
import { HDMasterSeed, MnemomicT, Mnemonic } from '@radixdlt/account'
import { map, tap } from 'rxjs/operators'
import { v4 as uuidv4 } from 'uuid'
import { MockedLedgerNanoRecorder } from './mockedLedgerNanoRecorder'
import { LedgerResponseCodes, SemVerT } from '../_types'
import { emulateSend } from './emulatedLedger'
import { SemVer } from './semVer'

import { msgFromError, log } from '@radixdlt/util'

import {
	LedgerTransportForDevice,
	openConnection,
	send,
} from './ledgerNanoDeviceConnector'

const __create = (
	input: Readonly<{
		sendAPDUToDevice: (apdu: RadixAPDUT) => Observable<Buffer>
		recorder?: MockedLedgerNanoRecorderT
	}>,
): LedgerNanoT => {
	const { recorder, sendAPDUToDevice: exchange } = input

	const sendRequestToDevice = (
		request: LedgerRequest,
	): Observable<LedgerResponse> => {
		const { uuid, apdu } = request
		recorder?.recordRequest(request)
		return exchange(apdu).pipe(
			map((data) => ({ data, uuid })),
			tap((response) => {
				recorder?.recordResponse(response)
			}),
		)
	}

	const sendAPDUToDevice = (apdu: RadixAPDUT): Observable<Buffer> => {
		const uuid = uuidv4()
		return sendRequestToDevice({ apdu, uuid }).pipe(
			map((response) => response.data),
		)
	}

	return {
		__sendRequestToDevice: sendRequestToDevice,
		sendAPDUToDevice,
	}
}

const emulate = (
	input: Readonly<{
		recorder?: MockedLedgerNanoRecorderT
		mnemonic?: MnemomicT
		passphrase?: string
		version?: SemVerT
	}>,
): MockedLedgerNanoT => {
	const passphrase = input.passphrase
	const mnemonic = input.mnemonic ?? Mnemonic.generateNew()

	const recorder = input.recorder ?? MockedLedgerNanoRecorder.create()

	const sendAPDUToDevice = emulateSend({
		recorder,
		hdMasterNode: HDMasterSeed.fromMnemonic({
			mnemonic,
			passphrase,
		}).masterNode(),
		hardcodedVersion:
			input.version ?? SemVer.fromString('0.0.1')._unsafeUnwrap(),
	})

	const ledgerNano = __create({
		sendAPDUToDevice,
		recorder: recorder,
	})

	return {
		...ledgerNano,
		store: recorder,
	}
}

const ledgerAPDUResponseCodeBufferLength = 2 // two bytes

const from = (
	ledgerTransportForDevice: LedgerTransportForDevice,
): LedgerNanoT => {
	const sendAPDUToDevice = (apdu: RadixAPDUT): Observable<Buffer> => {
		return new Observable<Buffer>((subscriber) => {
			send({
				apdu,
				with: ledgerTransportForDevice.connectedLedgerTransport,
			})
				.then((responseFromLedger) => {
					log.debug(
						`✅ got raw response from ledger device: ${responseFromLedger.toString(
							'hex',
						)}`,
					)

					if (
						responseFromLedger.length <
						ledgerAPDUResponseCodeBufferLength
					) {
						const errMsg = `Got too short response from Ledger, expected all responses to be at least #${ledgerAPDUResponseCodeBufferLength} bytes, but got: #${responseFromLedger.length} bytes`
						log.error(errMsg)
						subscriber.error(new Error(errMsg))
					}

					const responseCodeBuf = responseFromLedger.slice(
						-ledgerAPDUResponseCodeBufferLength,
					)
					const responseCode: LedgerResponseCodes = parseInt(
						responseCodeBuf.toString('hex'),
						16,
					)

					if (
						!apdu.requiredResponseStatusCodeFromDevice.includes(
							responseCode,
						)
					) {
						const errMsg = `Invalid response code, got ${responseCode}, but requires any of: ${JSON.stringify(
							apdu.requiredResponseStatusCodeFromDevice,
							null,
							4,
						)}`
						log.error(errMsg)
						subscriber.error(new Error(errMsg))
					}

					const result = responseFromLedger.slice(
						0,
						responseFromLedger.length -
							ledgerAPDUResponseCodeBufferLength,
					)

					subscriber.next(result)
					subscriber.complete()
				})
				.catch((error) => {
					if (
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
						error.statusCode !== undefined &&
						error.statusCode ===
							LedgerResponseCodes.CLA_NOT_SUPPORTED
					) {
						const errMsg = `🤷‍♀️ Wrong app/Radix app not opened on Ledger yet. ${msgFromError(
							error,
						)}`
						log.error(errMsg)
						subscriber.error(new Error(errMsg))
					} else {
						const errMsg = `SEND APDU failed with unknown error: '${msgFromError(
							error,
						)}'`
						log.error(errMsg)

						subscriber.error(new Error(errMsg))
					}
				})
		})
	}

	return {
		sendAPDUToDevice,
		__sendRequestToDevice: (_): Observable<LedgerResponse> =>
			throwError(
				() =>
					new Error(
						`__sendRequestToDevice is not implemented for physical devices.`,
					),
			),
	}
}

const waitForDeviceToConnect = async (
	input?: Readonly<{
		deviceConnectionTimeout?: number
		waitForRadixAppToBeOpened?: Readonly<{
			pingIntervalMS: number
			timeoutAfterNumberOfIntervals: number
		}>
	}>,
): Promise<LedgerNanoT> => {
	const ledgerTransportForDevice = await openConnection({
		deviceConnectionTimeout: input?.deviceConnectionTimeout,
		waitForRadixAppToBeOpened: input?.waitForRadixAppToBeOpened ?? {
			pingIntervalMS: 1_000,
			timeoutAfterNumberOfIntervals: 60,
		},
	})
	return from(ledgerTransportForDevice)
}

export const LedgerNano = {
	waitForDeviceToConnect,
	emulate,
}
