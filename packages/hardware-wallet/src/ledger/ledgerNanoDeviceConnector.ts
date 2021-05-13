import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
import { Subscription as LedgerSubscriptionType } from '@ledgerhq/hw-transport'
import { isNode, msgFromError } from '@radixdlt/util'
import { RadixAPDU } from './apdu'
import { RadixAPDUT } from './_types'
import { err } from 'neverthrow'
import { log } from '@radixdlt/util/dist/logging'

// export type BasicLedgerNano = {
// 	send: (
// 		cla: number,
// 		ins: number,
// 		p1: number,
// 		p2: number,
// 		data: Buffer,
// 	) => Promise<Buffer>
// 	device: {
// 		getDeviceInfo: () => unknown
// 	}
// }

export type BasicLedgerTransport = Pick<
	TransportNodeHid,
	'send' | 'device' | 'close'
>

// export type ConnEvent = {
// 	type: 'add' | 'remove'
// 	descriptor: string
// 	deviceModel: string
// 	// eslint-disable-next-line @typescript-eslint/no-explicit-any
// 	device: any
// }

// let transportNodeHid: typeof TransportNodeHid
// let outResolve: () => void
//
// const isImported: Promise<void> = new Promise((resolve, _) => {
// 	outResolve = resolve
// })
//
// if (isNode) {
// 	void import('@ledgerhq/hw-transport-node-hid').then((module) => {
// 		transportNodeHid = module.default
// 		outResolve()
// 	})
// } else {
// 	throw new Error(
// 		'Not running in Node environment. This is not supported in the browser.',
// 	)
// }

export const sendAPDUToBasicLedgerTransport = (
	input: Readonly<{
		basicLedgerTransport: BasicLedgerTransport
		apdu: RadixAPDUT
	}>,
): Promise<Buffer> => {
	const { apdu, basicLedgerTransport } = input
	const statusList = [
		...apdu.requiredResponseStatusCodeFromDevice.map((s) => s.valueOf()),
	]
	return basicLedgerTransport.send(
		apdu.cla,
		apdu.ins,
		apdu.p1,
		apdu.p2,
		apdu.data,
		statusList,
	)
}

// /*
//     Subscribes to events that fire when the Ledger device has connected/disconnected.
// */
// const subscribeDeviceConnection = async (
// 	next: (isConnected: boolean) => void,
// ): Promise<LedgerSubscriptionType> => {
// 	await isImported
//
// 	return transportNodeHid.listen({
// 		next: (event) => {
// 			console.log(`🔮 next event: ${JSON.stringify(event, null, 4)}`)
// 			switch (event.type) {
// 				case 'add':
// 					next(true)
// 					break
// 				case 'remove':
// 					next(false)
// 					break
// 			}
// 		},
// 		error: (error) => {
// 			console.log(`🔮 error: ${error}`)
// 			next(false)
// 		},
// 		complete: () => {
// 			console.log(`🔮 complete`)
// 			next(false)
// 		},
// 		// next: async (obj: ConnEvent) => {
// 		// 	switch (obj.type) {
// 		// 		case 'add':
// 		// 			next(true)
// 		// 			break
// 		// 		case 'remove':
// 		// 			next(false)
// 		// 			break
// 		// 	}
// 		// },
// 	})
// }

const getDevicePath = async (
	input?: Readonly<{
		pingIntervalMS: number
		timeoutAfterNumberOfIntervals: number
	}>,
): Promise<string> => {
	const timeoutAfterNumberOfIntervals =
		input?.timeoutAfterNumberOfIntervals ?? 2
	const pingIntervalMS = input?.pingIntervalMS ?? 500

	if (timeoutAfterNumberOfIntervals < 1) {
		throw new Error('Number of intervals cannot be less than 1')
	}
	const timeout = pingIntervalMS * timeoutAfterNumberOfIntervals

	const doGetDevicePath = async (): Promise<string> => {
		const devices = await TransportNodeHid.list()
		return devices.length > 0
			? Promise.resolve(devices[0])
			: Promise.reject(new Error('No Ledger device found'))
	}

	let intervalId: NodeJS.Timeout
	return new Promise((resolve, reject) => {
		const noDeviceConnectedTimeoutId = setTimeout(() => {
			reject(
				new Error(
					`After ${timeout} ms we still did not find any device.`,
				),
			)
		}, timeout)

		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		intervalId = setInterval(async () => {
			void doGetDevicePath()
				.then((devicePath) => {
					// clear self
					clearInterval(intervalId)

					clearTimeout(noDeviceConnectedTimeoutId)
					resolve(devicePath)
					return
				})
				.catch((_) => {
					// supress error so that we can call `doGetDevicePath` again.
				})
		}, pingIntervalMS)
	})
}

const waitForRadixAppToOpen = async (
	input: Readonly<{
		basicLedgerTransport: BasicLedgerTransport
		waitForRadixAppToBeOpened: Readonly<{
			pingIntervalMS: number
			timeoutAfterNumberOfIntervals: number
		}>
	}>,
): Promise<BasicLedgerTransport> => {
	log.debug(`📲 ⏱ Waiting for Radix app to be started on Ledger.`)
	const { waitForRadixAppToBeOpened } = input
	const {
		pingIntervalMS,
		timeoutAfterNumberOfIntervals,
	} = waitForRadixAppToBeOpened

	let basicLedgerTransport = input.basicLedgerTransport

	if (timeoutAfterNumberOfIntervals < 1) {
		throw new Error('Number of intervals cannot be less than 1')
	}
	const timeout = pingIntervalMS * timeoutAfterNumberOfIntervals

	const sendPingCommand = async (): Promise<boolean> => {
		const getVersionAsPINGCommand = RadixAPDU.getVersion()

		return sendAPDUToBasicLedgerTransport({
			apdu: getVersionAsPINGCommand,
			basicLedgerTransport,
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
				resolve(basicLedgerTransport)
				return
			}

			// This line is crucial. We MUST close the transport and reopen it for
			// pinging to work. Otherwise we get `Cannot write to hid device` forever.
			// at least from macOS Big Sur on Ledger Nano with Secure Elements version 1.6.0
			// and MCU 1.11
			await basicLedgerTransport.close()

			// Prudent to refresh list of devices as well
			const devicePath = await getDevicePath()
			basicLedgerTransport = await TransportNodeHid.open(devicePath)
		}, pingIntervalMS)
	})
}

export const openConnection = async (
	input?: Readonly<{
		waitForDeviceToConnect?: Readonly<{
			pingIntervalMS: number
			timeoutAfterNumberOfIntervals: number
		}>
		waitForRadixAppToBeOpened?: Readonly<{
			pingIntervalMS: number
			timeoutAfterNumberOfIntervals: number
		}>
	}>,
): Promise<BasicLedgerTransport> => {
	log.debug(`🔌⏱ Looking for (unlocked 🔓) Ledger device to connect to.`)

	const devicePath = await getDevicePath(input?.waitForDeviceToConnect)
	const basicLedgerTransport = await TransportNodeHid.open(devicePath)
	log.debug(`🔌✅ Found Ledger device and connected to it.`)
	const waitForRadixAppToBeOpened = input?.waitForRadixAppToBeOpened
	if (!waitForRadixAppToBeOpened) {
		return Promise.resolve(basicLedgerTransport)
	} else {
		return waitForRadixAppToOpen({
			basicLedgerTransport,
			waitForRadixAppToBeOpened,
		})
	}
}
