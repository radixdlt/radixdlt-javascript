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

// import { Transport } from '@ledgerhq/hw-transport-node-hid'
import { Descriptor, DescriptorEvent } from '@ledgerhq/hw-transport'
import { isSomeEnum, msgFromError } from '@radixdlt/util'
import { log } from '@radixdlt/util/'

/// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-var-requires
// import HID = require('node-hid')

import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
import { Device } from 'node-hid'

import { Subscription as LedgerSubscriptionType } from '@ledgerhq/hw-transport'

type LedgerTransportStatusErrorRaw = Readonly<{
	name: string
	message: string
	stack: string
	statusCode: number
	statusText: string
}>

type LedgerTransportStatusError = LedgerTransportStatusErrorRaw &
	Readonly<{
		statusCode: LedgerResponseCodes
	}>

const isLedgerTransportStatusErrorRaw = (
	something: unknown,
): something is LedgerTransportStatusErrorRaw => {
	const inspection = something as LedgerTransportStatusErrorRaw
	return (
		inspection.name !== undefined &&
		inspection.message !== undefined &&
		inspection.stack !== undefined &&
		inspection.statusText !== undefined &&
		inspection.statusCode !== undefined
	)
}

let transportNodeHid: TransportNodeHid
const fromLedgerTransportNodeHID = (
	deviceConnection: TransportNodeHid,
): LedgerNanoT => {
	log.debug(
		`🔌🎉 creating 'LedgerNanoT' with 'deviceConnection: TransportNodeHid', deviceConnection.device: ${JSON.stringify(
			deviceConnection.device,
			null,
			4,
		)}`,
	)

	const subs = new Subscription()
	const requestSubject = new Subject<RadixAPDUT>()

	const responseSubject = new Subject<Buffer>()
	let retryUntilAppIsOpenTimeout = 200
	transportNodeHid = deviceConnection
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

				const statusList = undefined // [ apdu.requiredResponseStatusCodeFromDevice.map((s) => s.valueOf())]

				transportNodeHid
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
						responseSubject.next(responseFromLedger)
					})
					.catch((error) => {
						if (isLedgerTransportStatusErrorRaw(error)) {
							const errorCode = error.statusCode

							if (
								errorCode ===
								LedgerResponseCodes.CLA_NOT_SUPPORTED
							) {
								log.info(
									`🔥🙋🏾‍♀️ correct APP not open yet, wait for ${retryUntilAppIsOpenTimeout} and then try again.`,
								)
								// App not started yet... retry..?
								retryUntilAppIsOpenTimeout *= 2
								setTimeout(() => {
									requestSubject.next(apdu) // retry
								}, retryUntilAppIsOpenTimeout)
							} else {
								const errMsg = `Error from ledger device: ${msgFromError(
									error,
								)}`
								log.error(errMsg)
								responseSubject.error(new Error(errMsg))
							}
						} else {
							const errMsg = `SEND APDU failed with unknown error: '${msgFromError(
								error,
							)}'`
							log.error(errMsg)

							responseSubject.error(new Error(errMsg))
						}
					})
			},
		}),
	)

	const sendAPDUToDevice = (apdu: RadixAPDUT): Observable<Buffer> => {
		requestSubject.next(apdu)
		return responseSubject.pipe(take(1))
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
let subscription: LedgerSubscriptionType
const waitForDeviceToConnect = async (
	timeout?: number,
): Promise<LedgerNanoT> => {
	// $ExpectType Promise<boolean>
	//TransportNodeHid.isSupported()
	// $ExpectType Promise<ReadonlyArray<string>>
	//TransportNodeHid.list()
	// $ExpectType Promise<TransportNodeHid>
	//TransportNodeHid.open('test')
	const devicePromise: Promise<Device> = new Promise((resolve, reject) => {
		subscription = TransportNodeHid.listen({
			next: (event: DescriptorEvent<Descriptor>) => {
				log.info(`🔮 Ledger event: ${JSON.stringify(event, null, 4)}`)

				const type = event.type
				if (type === 'add') {
					log.info(
						`🔌🔗 Ledger connected, json: ${JSON.stringify(
							event.device,
							null,
							4,
						)}`,
					)
					log.debug(
						`trying to type cast 'event.device' as (node-hid).Device...`,
					)
					const device = event.device as Device
					if (!device.path) {
						const errMsg = `ERROR! Added device lacks device path: ${JSON.stringify(
							device,
							null,
							4,
						)}`
						log.error(errMsg)
						reject(new Error(errMsg))
					}
					resolve(device)
				} else if (type === 'remove') {
					log.info(`❌ Ledger disconnected`)
					reject(new Error('Ledger disconnected'))
				} else {
					const errMsg = `Incorrect implementation, failed to cover event type for Ledger Nano: ${type}`
					log.error(errMsg)
					throw errMsg
				}
			},

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			error: (error: any) => {
				const errMsg = msgFromError(error)
				log.error(errMsg)
				reject(errMsg)
			},
			complete: () => {
				const msg = `Ledger... complete..? What does this mean?`
				log.info(msg)
				reject(new Error(msg))
			},
		})
	})

	return devicePromise
		.then((device: Device) => {
			log.debug(`👍 got device, trying to open connection`)
			return TransportNodeHid.open(device.path!)
		})
		.then((deviceConnection: TransportNodeHid) => {
			log.debug(
				`👍 opened connection to device, instantiating a 'LedgerNanoT' with it...`,
			)
			return fromLedgerTransportNodeHID(deviceConnection)
		})
}

export const LedgerNano = {
	waitForDeviceToConnect,
	emulate,
}
