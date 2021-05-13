import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
import { Subscription as LedgerSubscriptionType } from '@ledgerhq/hw-transport'
import { msgFromError } from '@radixdlt/util'
import { RadixAPDU } from './apdu'
import { RadixAPDUT } from './_types'
import { log } from '@radixdlt/util/dist/logging'

import { Device as NodeHidDevice } from 'node-hid'

type ConnectedLedger = NodeHidDevice & {
	path: string
}

type BasicLedgerTransport = Pick<TransportNodeHid, 'send' | 'device' | 'close'>

export type LedgerTransportForDevice = Readonly<{
	connectedLedgerTransport: BasicLedgerTransport
	connectedLedgerDevice: ConnectedLedger
}>

export const send = (
	input: Readonly<{
		apdu: RadixAPDUT
		with: BasicLedgerTransport
	}>,
): Promise<Buffer> => {
	const { apdu, with: connectedLedgerTransport } = input
	const statusList = [
		...apdu.requiredResponseStatusCodeFromDevice.map((s) => s.valueOf()),
	]
	return connectedLedgerTransport.send(
		apdu.cla,
		apdu.ins,
		apdu.p1,
		apdu.p2,
		apdu.data,
		statusList,
	)
}

// const getDevicePath = async (
// 	input?: Readonly<{
// 		pingIntervalMS: number
// 		timeoutAfterNumberOfIntervals: number
// 	}>,
// ): Promise<string> => {
// 	const timeoutAfterNumberOfIntervals =
// 		input?.timeoutAfterNumberOfIntervals ?? 2
// 	const pingIntervalMS = input?.pingIntervalMS ?? 500
//
// 	if (timeoutAfterNumberOfIntervals < 1) {
// 		throw new Error('Number of intervals cannot be less than 1')
// 	}
// 	const timeout = pingIntervalMS * timeoutAfterNumberOfIntervals
//
// 	const doGetDevicePath = async (): Promise<string> => {
// 		const devices = await TransportNodeHid.list()
// 		return devices.length > 0
// 			? Promise.resolve(devices[0])
// 			: Promise.reject(new Error('No Ledger device found'))
// 	}
//
// 	let intervalId: NodeJS.Timeout
// 	return new Promise((resolve, reject) => {
// 		const noDeviceConnectedTimeoutId = setTimeout(() => {
// 			reject(
// 				new Error(
// 					`After ${timeout} ms we still did not find any device.`,
// 				),
// 			)
// 		}, timeout)
//
// 		// eslint-disable-next-line @typescript-eslint/no-misused-promises
// 		intervalId = setInterval(async () => {
// 			void doGetDevicePath()
// 				.then((devicePath) => {
// 					// clear self
// 					clearInterval(intervalId)
//
// 					clearTimeout(noDeviceConnectedTimeoutId)
// 					resolve(devicePath)
// 					return
// 				})
// 				.catch((_) => {
// 					// supress error so that we can call `doGetDevicePath` again.
// 				})
// 		}, pingIntervalMS)
// 	})
// }

const waitForRadixAppToOpen = async (
	input: Readonly<{
		ledgerTransportForDevice: LedgerTransportForDevice
		waitForRadixAppToBeOpened: Readonly<{
			pingIntervalMS: number
			timeoutAfterNumberOfIntervals: number
		}>
	}>,
): Promise<LedgerTransportForDevice> => {
	log.debug(`📲 ⏱ Waiting for Radix app to be started on Ledger.`)
	const { waitForRadixAppToBeOpened } = input
	const {
		pingIntervalMS,
		timeoutAfterNumberOfIntervals,
	} = waitForRadixAppToBeOpened

	let ledgerTransportForDevice = input.ledgerTransportForDevice

	if (timeoutAfterNumberOfIntervals < 1) {
		throw new Error('Number of intervals cannot be less than 1')
	}
	const timeout = pingIntervalMS * timeoutAfterNumberOfIntervals

	const sendPingCommand = async (): Promise<boolean> => {
		const getVersionAsPINGCommand = RadixAPDU.getVersion()

		return send({
			apdu: getVersionAsPINGCommand,
			with: ledgerTransportForDevice.connectedLedgerTransport,
		})
			.then((_) => {
				return true
			})
			.catch((_) => {
				return false
			})
	}

	let intervalId: NodeJS.Timeout

	return new Promise((resolve, reject) => {
		const appDidNotOpenTimeoutId = setTimeout(() => {
			reject(
				new Error(
					`After ${timeout} ms Radix app is still not opened. Timeout.`,
				),
			)
		}, timeout)

		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		intervalId = setInterval(async () => {
			const isAppOpen = await sendPingCommand()
			if (isAppOpen) {
				log.debug(
					`📲 ✅ Radix app is started on Ledger, ready to receive commands.`,
				)

				// clear self
				clearInterval(intervalId)

				clearTimeout(appDidNotOpenTimeoutId)
				resolve(ledgerTransportForDevice)
				return
			}

			// const connectedLedgerDevice =
			// 	ledgerTransportForDevice.connectedLedgerDevice

			// This line is crucial. We MUST close the transport and reopen it for
			// pinging to work. Otherwise we get `Cannot write to hid device` forever.
			// at least from macOS Big Sur on Ledger Nano with Secure Elements version 1.6.0
			// and MCU 1.11
			await ledgerTransportForDevice.connectedLedgerTransport.close()
			ledgerTransportForDevice = await __openConnection(false, {
				deviceConnectionTimeout: 1_000,
			})
			// .then((_) => {
			// 	return TransportNodeHid.open(connectedLedgerDevice.path)
			// })
			// .catch((errorWhileReopeningDevice) => {
			// 	const warnMessage = `Error while reopning device... Try again? Underlying error: ${msgFromError(
			// 		errorWhileReopeningDevice,
			// 	)}`
			// 	log.warn(warnMessage)
			// })
			// .then((connectedLedgerTransportNew) => {
			// 	if (connectedLedgerTransportNew) {
			// 		ledgerTransportForDevice = {
			// 			connectedLedgerTransport: connectedLedgerTransportNew,
			// 			connectedLedgerDevice,
			// 		}
			// 	} else {
			// 		log.warn(`failed to reopen device..? try again..?`)
			// 	}
			// })
		}, pingIntervalMS)
	})
}

const ledgerConnection = (timeout?: number): Promise<ConnectedLedger> => {
	let ledgerSubscriptionLike: LedgerSubscriptionType | undefined
	let timeoutId: NodeJS.Timeout

	const cleanUp = (): void => {
		ledgerSubscriptionLike?.unsubscribe()
		clearTimeout(timeoutId)
	}

	return new Promise((resolve, reject) => {
		if (timeout) {
			timeoutId = setTimeout(() => {
				const errMsg = `Timed out waiting for ledger device.`
				log.error(errMsg)
				reject(new Error(errMsg))
			}, timeout)
		}
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		ledgerSubscriptionLike = TransportNodeHid.listen({
			next: (event) => {
				cleanUp()
				if (event.type === 'add') {
					const device = event.device as NodeHidDevice
					if (!device.path) {
						const errMsg = `Expected newly connected ("added") device to have a 'path'`
						log.error(errMsg)
						throw new Error(errMsg)
					}
					const connectedLedger = device as ConnectedLedger
					resolve(connectedLedger)
				} else if (event.type === 'remove') {
					const msg = `Ledger device removed, this is not yet handled. Probably should be though`
					log.warn(msg)
				}
			},
			error: (error) => {
				cleanUp()
				const errMsg = `Error listening for ledger device, underlying error: '${msgFromError(
					error,
				)}'`
				log.error(errMsg)
				reject(new Error(errMsg))
			},
			complete: () => {
				cleanUp()
			},
		})
	})
}

const __openConnection = async (
	isLoggingEnabled: boolean,
	input?: Readonly<{
		deviceConnectionTimeout?: number
		waitForRadixAppToBeOpened?: Readonly<{
			pingIntervalMS: number
			timeoutAfterNumberOfIntervals: number
		}>
	}>,
): Promise<LedgerTransportForDevice> => {
	if (isLoggingEnabled) {
		log.debug(`🔌⏱ Looking for (unlocked 🔓) Ledger device to connect to.`)
	}

	const connectedLedgerDevice = await ledgerConnection(
		input?.deviceConnectionTimeout,
	)
	const connectedLedgerTransport = await TransportNodeHid.open(
		connectedLedgerDevice.path,
	)
	const ledgerTransportForDevice: LedgerTransportForDevice = {
		connectedLedgerDevice,
		connectedLedgerTransport,
	}
	if (isLoggingEnabled) {
		log.debug(`🔌✅ Found Ledger device and connected to it.`)
	}
	const waitForRadixAppToBeOpened = input?.waitForRadixAppToBeOpened
	if (!waitForRadixAppToBeOpened) {
		return Promise.resolve(ledgerTransportForDevice)
	} else {
		return waitForRadixAppToOpen({
			ledgerTransportForDevice,
			waitForRadixAppToBeOpened,
		})
	}
}

export const openConnection = async (
	input?: Readonly<{
		deviceConnectionTimeout?: number
		waitForRadixAppToBeOpened?: Readonly<{
			pingIntervalMS: number
			timeoutAfterNumberOfIntervals: number
		}>
	}>,
): Promise<LedgerTransportForDevice> => {
	return __openConnection(true, input)
}
