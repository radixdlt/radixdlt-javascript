import {
	LedgerNanoT,
	LedgerRequest,
	LedgerResponse,
	MockedLedgerNanoRecorderT,
	MockedLedgerNanoT,
	RadixAPDUT,
} from './_types'
import { Observable, Subject, Subscription, throwError } from 'rxjs'
import { HDMasterSeed, MnemomicT, Mnemonic } from '@radixdlt/account'
import { map, take, tap } from 'rxjs/operators'
import { v4 as uuidv4 } from 'uuid'
import { MockedLedgerNanoRecorder } from './mockedLedgerNanoRecorder'
import { LedgerResponseCodes, SemVerT } from '../_types'
import { emulateSend } from './emulatedLedger'
import { SemVer } from './semVer'

import { msgFromError } from '@radixdlt/util'
import { log } from '@radixdlt/util/'

import {
	BasicLedgerTransport,
	openConnection,
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

export const fromLedgerTransportNodeHID = (
	basicLedgerTransport: BasicLedgerTransport,
): LedgerNanoT => {
	log.debug(
		`🔌🎉 creating 'LedgerNanoT' with 'deviceConnection: TransportNodeHid', deviceConnection.device: ${JSON.stringify(
			basicLedgerTransport.device,
			null,
			4,
		)}`,
	)

	const subs = new Subscription()
	const requestSubject = new Subject<RadixAPDUT>()

	const responseSubject = new Subject<Buffer>()
	let retryUntilAppIsOpenTimeout = 200
	subs.add(
		requestSubject.subscribe({
			next: (apdu) => {
				log.info(
					`🚀 sending APDU to physical ledger: ${JSON.stringify(
						apdu,
						null,
						4,
					)}`,
				)



			},
		}),
	)

	const sendAPDUToDevice = (apdu: RadixAPDUT): Observable<Buffer> => {
		const statusList = undefined // [ apdu.requiredResponseStatusCodeFromDevice.map((s) => s.valueOf())]
		return new Observable<Buffer>((subscriber) => {
			basicLedgerTransport
				.send(
					apdu.cla,
					apdu.ins,
					apdu.p1,
					apdu.p2,
					apdu.data,
					statusList,
				)
				.then((responseFromLedger) => {
					log.debug(
						`✅ got response from ledger device: ${responseFromLedger.toString(
							'hex',
						)}`,
					)
					subscriber.next(responseFromLedger)
					subscriber.complete()
				})
				.catch((error) => {
					if (
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
						error.statusCode !== undefined &&
						error.statusCode ===
							LedgerResponseCodes.CLA_NOT_SUPPORTED
					) {
						const errMsg = `🤷‍♀️ Wrong app/Radix app not opened on Ledger yet. ${msgFromError(error)}`
						log.error(errMsg)
						// log.info(
						// 	`🔥🙋🏾‍♀️ correct APP not open yet, wait for ${retryUntilAppIsOpenTimeout} and then try again.`,
						// )
						// // App not started yet... retry..?
						// retryUntilAppIsOpenTimeout *= 2
						// setTimeout(() => {
						// 	requestSubject.next(apdu) // retry
						// }, retryUntilAppIsOpenTimeout)
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

// When to dispose of this? and how?
const waitForDeviceToConnect = async (
	timeout?: number,
): Promise<LedgerNanoT> => {
	const ledgerTransport: BasicLedgerTransport = await openConnection()
	return fromLedgerTransportNodeHID(ledgerTransport)
}

export const LedgerNano = {
	waitForDeviceToConnect,
	emulate,
}
