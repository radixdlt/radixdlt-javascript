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

const delay = async (ms: number): Promise<void> => {
	return new Promise((resolve, _) => {
		setTimeout(() => {
			resolve()
		}, ms)
	})
}

export type OpenLedgerConnectionInput = Readonly<{
	deviceConnectionTimeout?: number
	radixAppToOpenWaitPolicy?: Readonly<{
		retryCount: number
		delayBetweenRetries: number
	}>
}>

const __openConnection = async (
	isLoggingEnabled: boolean,
	input?: OpenLedgerConnectionInput,
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
	const radixAppToOpenWaitPolicy = input?.radixAppToOpenWaitPolicy

	if (!radixAppToOpenWaitPolicy) {
		return Promise.resolve(basicLedgerTransport)
	} else {
		if (isLoggingEnabled) {
			log.debug(`📲 ⏱ Waiting for Radix app to be started on Ledger.`)
		}
		const delayBetweenRetries = radixAppToOpenWaitPolicy.delayBetweenRetries
		const retryCount = radixAppToOpenWaitPolicy.retryCount
		if (retryCount < 1) {
			const errMsg = `Timedout waiting for Radix App to open`
			log.error(errMsg)
			return Promise.reject(new Error(errMsg))
		}

		await delay(delayBetweenRetries)

		return send({
			apdu: RadixAPDU.getVersion(),
			with: basicLedgerTransport,
		})
			.then((_) => {
				return Promise.resolve(basicLedgerTransport)
			})
			.catch((_) => {
				// We MUST close the transport and reopen it for pinging to work.
				// Otherwise we get `Cannot write to hid device` forever.
				// at least from macOS Big Sur on Ledger Nano with Secure Elements version 1.6.0
				// and MCU 1.11
				return basicLedgerTransport.close().then(() => {
					return __openConnection(false, {
						deviceConnectionTimeout: 1_000,
						radixAppToOpenWaitPolicy: {
							// Exponential backing off...
							delayBetweenRetries: delayBetweenRetries * 1.1,
							// Decrease retry count
							retryCount: retryCount - 1,
						},
					})
				})
			})
	}
}

export const openConnection = async (
	input?: OpenLedgerConnectionInput,
): Promise<BasicLedgerTransport> => {
	return __openConnection(true, input)
}
