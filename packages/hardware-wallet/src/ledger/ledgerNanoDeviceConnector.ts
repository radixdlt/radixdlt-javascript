import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
import { Subscription as LedgerSubscriptionType } from '@ledgerhq/hw-transport'
import { isNode, msgFromError } from '@radixdlt/util'
import { RadixAPDU } from './apdu'
import { RadixAPDUT } from './_types'

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

let transportNodeHid: typeof TransportNodeHid
let outResolve: () => void

const isImported: Promise<void> = new Promise((resolve, _) => {
	outResolve = resolve
})

if (isNode) {
	void import('@ledgerhq/hw-transport-node-hid').then((module) => {
		transportNodeHid = module.default
		outResolve()
	})
} else {
	throw new Error(
		'Not running in Node environment. This is not supported in the browser.',
	)
}

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

export const openConnection = async (
	waitForRadixAppToBeOpened?: Readonly<{
		pingIntervalMS: number
		timeoutAfterNumberOfIntervals: number
	}>,
): Promise<BasicLedgerTransport> => {
	await isImported

	const devices = await transportNodeHid.list()

	if (!devices[0]) {
		throw new Error('No device found.')
	}
	let basicLedgerTransport = await transportNodeHid.open(devices[0])
	if (!waitForRadixAppToBeOpened) {
		return Promise.resolve(basicLedgerTransport)
	} else {
		const {
			pingIntervalMS,
			timeoutAfterNumberOfIntervals,
		} = waitForRadixAppToBeOpened
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
					console.log(`👻 success?!`)
					return true
				})
				.catch((err) => {
					console.log(
						`👻❌ app not opened, error: ${msgFromError(err)}`,
					)
					return false
				})
		}

		return new Promise((resolve, reject) => {
			const appDidNotOpenTimeoutId = setTimeout(() => {
				reject(
					new Error(
						`After ${timeout} ms Radix app is still not opened. Timeout.`,
					),
				)
			}, timeout)

			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			setInterval(async () => {
				const isAppOpen = await sendPingCommand()
				if (isAppOpen) {
					console.log(
						`🎉🎉🎉 App is opened! Cancelling timers and resolving promise`,
					)
					clearTimeout(appDidNotOpenTimeoutId)
					resolve(basicLedgerTransport)
					return
				}
				console.log(
					`❌ App is not opened! Scheduling recursive call to ping`,
				)
				await basicLedgerTransport.close()
				basicLedgerTransport = await transportNodeHid.open(devices[0])
			}, pingIntervalMS)

			// const ping = async (): Promise<void> => {
			// 	console.log(
			// 		`🤷‍♀️ about to ping device and check if app is opened.`,
			// 	)
			// 	return sendPingCommand().then((isAppOpened) => {
			// 		if (isAppOpened) {
			// 			console.log(
			// 				`🎉🎉🎉 App is opened! Cancelling timers and resolving promise`,
			// 			)
			// 			clearTimeout(pingDeviceTimeoutId)
			// 			clearTimeout(appDidNotOpenTimeoutId)
			// 			resolve(basicLedgerTransport)
			// 		} else {
			// 			console.log(
			// 				`❌ App is not opened! Scheduling recursive call to ping`,
			// 			)
			//
			// 			// recursive call after 'interval' ms
			// 			pingDeviceTimeoutId = setTimeout(() => {
			// 				// eslint-disable-next-line @typescript-eslint/no-unused-vars
			// 				void ping()
			// 			}, pingIntervalMS)
			// 		}
			// 	})
			// }
			//
			// // start pinging device.
			// void ping()
		})
	}
}
