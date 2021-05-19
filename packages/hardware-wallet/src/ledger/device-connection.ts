import { RadixAPDU } from './apdu'
import { RadixAPDUT } from './_types'
import { log } from '@radixdlt/util'
import { LedgerInstruction } from '../_types'

export type BasicLedgerTransport = Readonly<{
	close: () => Promise<void>
	send: (
		cla: number,
		ins: number,
		p1: number,
		p2: number,
		data?: Buffer,
		statusList?: ReadonlyArray<number>,
	) => Promise<Buffer>
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

	if (apdu.ins === LedgerInstruction.PING) {
		log.debug(`🏓 📲 sending PING APDU to Ledger device`)
	} else {
		log.debug(`📦 📲 sending APDU to Ledger device:
			instruction: ${apdu.ins},
			p1: ${apdu.p1},
			p2: ${apdu.p2},
			data: ${apdu.data !== undefined ? apdu.data.toString('hex') : '<UNDEFINED>'},
		`)
	}
	return connectedLedgerTransport.send(
		apdu.cla,
		apdu.ins === LedgerInstruction.PING
			? LedgerInstruction.GET_VERSION
			: apdu.ins,
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

	const basicLedgerTransport: BasicLedgerTransport = await import(
		'@ledgerhq/hw-transport-node-hid'
	).then(
		async (module): Promise<BasicLedgerTransport> => {
			const TransportNodeHid = module.default

			return await TransportNodeHid.create(
		input?.deviceConnectionTimeout,
		input?.deviceConnectionTimeout,
	)
		},
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
			apdu: RadixAPDU.ping,
			with: basicLedgerTransport,
		})
			.then((_) => {
				console.log(`📲 ✅ Got PONG 🏓, Radix app is open.`)
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
