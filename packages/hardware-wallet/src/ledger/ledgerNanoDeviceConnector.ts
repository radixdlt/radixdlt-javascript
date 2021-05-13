import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
import { RadixAPDU } from './apdu'
import { RadixAPDUT } from './_types'
import { log } from '@radixdlt/util/dist/logging'

export type BasicLedgerTransport = Pick<TransportNodeHid, 'send' | 'close'>

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

		return send({
			apdu: getVersionAsPINGCommand,
			with: basicLedgerTransport,
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
			basicLedgerTransport = await __openConnection(false, {
				deviceConnectionTimeout: 1_000,
			})
		}, pingIntervalMS)
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
): Promise<BasicLedgerTransport> => {
	if (isLoggingEnabled) {
		log.debug(`🔌⏱ Looking for (unlocked 🔓) Ledger device to connect to.`)
	}

	const basicLedgerTransport: BasicLedgerTransport = await TransportNodeHid.create(
		input?.deviceConnectionTimeout,
		input?.deviceConnectionTimeout,
	)

	if (isLoggingEnabled) {
		log.debug(`🔌✅ Found Ledger device and connected to it.`)
	}
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

export const openConnection = async (
	input?: Readonly<{
		deviceConnectionTimeout?: number
		waitForRadixAppToBeOpened?: Readonly<{
			pingIntervalMS: number
			timeoutAfterNumberOfIntervals: number
		}>
	}>,
): Promise<BasicLedgerTransport> => {
	return __openConnection(true, input)
}
