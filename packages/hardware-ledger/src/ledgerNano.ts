import {
	LedgerNanoT,
	LedgerRequest,
	LedgerResponse,
	LedgerResponseCodes,
	MockedLedgerNanoRecorderT,
	MockedLedgerNanoT,
	prettifyLedgerResponseCode,
	RadixAPDUT,
} from './_types'
import { from, Observable, of, throwError } from 'rxjs'
import { map, tap } from 'rxjs/operators'
import { v4 as uuidv4 } from 'uuid'
import { MockedLedgerNanoRecorder } from './mockedLedgerNanoRecorder'
import { emulateSend } from './emulatedLedger'

import { msgFromError, log } from '@radixdlt/util'
import { MnemomicT, HDMasterSeed, Mnemonic } from '@radixdlt/crypto'

import {
	BasicLedgerTransport,
	openConnection,
	OpenLedgerConnectionInput,
	send,
} from './device-connection'
import { SemVerT, SemVer } from '@radixdlt/hardware-wallet'

const __create = (
	input: Readonly<{
		close: () => Observable<void>
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
			map(data => ({ data, uuid })),
			tap(response => {
				recorder?.recordResponse(response)
			}),
		)
	}

	const sendAPDUToDevice = (apdu: RadixAPDUT): Observable<Buffer> => {
		const uuid = uuidv4()
		return sendRequestToDevice({ apdu, uuid }).pipe(
			map(response => response.data),
		)
	}

	return {
		...input,
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
			input.version ?? SemVer.fromString('0.2.3')._unsafeUnwrap(),
	})

	const ledgerNano = __create({
		close: () => of(undefined),
		sendAPDUToDevice,
		recorder: recorder,
	})

	return {
		...ledgerNano,
		store: recorder,
	}
}

const ledgerAPDUResponseCodeBufferLength = 2 // two bytes

const fromTransport = (
	basicLedgerTransport: BasicLedgerTransport,
): LedgerNanoT => {
	const sendAPDUToDevice = (apdu: RadixAPDUT): Observable<Buffer> =>
		new Observable<Buffer>(subscriber => {
			send({
				apdu,
				with: basicLedgerTransport,
			})
				.then(responseFromLedger => {
					log.debug(
						`📲 🥩 Raw response from Ledger device: ${responseFromLedger.toString(
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

					log.debug(
						`📲 Response code Ledger device: ${prettifyLedgerResponseCode(
							responseCode,
						)}`,
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

					log.debug(
						`📲 ✅ Response data Ledger device: ${result.toString(
							'hex',
						)}`,
					)

					subscriber.next(result)
					subscriber.complete()
				})
				.catch(error => {
					if (
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
						error.statusCode !== undefined &&
						error.statusCode ===
							LedgerResponseCodes.SW_CLA_NOT_SUPPORTED
					) {
						const errMsg = `🤷‍♀️ Wrong app/Radix app not opened on Ledger yet. ${msgFromError(
							error,
						)}`
						log.error(errMsg)
						subscriber.error(new Error(errMsg))
					} else {
						const ledgerResponseCodesFromError: string | undefined =
							LedgerResponseCodes[error.statusCode]

						const underlyingError =
							ledgerResponseCodesFromError ?? msgFromError(error)

						const errMsg = `SEND APDU failed with underlying error: '${underlyingError}'`
						log.error(errMsg)

						subscriber.error(new Error(errMsg))
					}
				})
		})

	return {
		close: (): Observable<void> => from(basicLedgerTransport.close()),
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

const connect = async (
	input?: OpenLedgerConnectionInput,
): Promise<LedgerNanoT> => {
	const ledgerTransportForDevice = await openConnection({
		deviceConnectionTimeout: input?.deviceConnectionTimeout,
		radixAppToOpenWaitPolicy: input?.radixAppToOpenWaitPolicy ?? {
			delayBetweenRetries: 1_000,
			retryCount: 60,
		},
	})
	return fromTransport(ledgerTransportForDevice)
}

export const LedgerNano = {
	connect,
	emulate,
}
