import { RadixAPDU } from './apdu'
import { log } from '@radixdlt/util'
import { LedgerResponseCodes, RadixAPDUT } from './_types'

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
	const acceptableStatusCodes = apdu.requiredResponseStatusCodeFromDevice ?? [
		LedgerResponseCodes.SW_OK,
	]
	const statusList = [...acceptableStatusCodes.map(s => s.valueOf())]

	log.debug(`📦📲 sending APDU to Ledger device:
			instruction: ${apdu.ins},
			p1: ${apdu.p1},
			p2: ${apdu.p2},
			data: ${apdu.data !== undefined ? apdu.data.toString('hex') : '<UNDEFINED>'},
		`)
	return connectedLedgerTransport.send(
		apdu.cla,
		apdu.ins,
		apdu.p1,
		apdu.p2,
		apdu.data,
		statusList,
	)
}

const delay = async (ms: number): Promise<void> =>
	new Promise((resolve, _) => {
		setTimeout(() => {
			resolve()
		}, ms)
	})

export type OpenLedgerConnectionInput = Readonly<{
	deviceConnectionTimeout?: number
	radixAppToOpenWaitPolicy?: Readonly<{
		retryCount: number
		delayBetweenRetries: number
	}>
}>

const __openConnection = async (
	isLoggingEnabled: boolean,
	transport: BasicLedgerTransport,
	input?: OpenLedgerConnectionInput,
): Promise<BasicLedgerTransport> => {
	if (isLoggingEnabled) {
		log.debug(`🔌⏱ Looking for (unlocked 🔓) Ledger device to connect to.`)
	}

	if (isLoggingEnabled) {
		log.debug(`🔌✅ Found Ledger device and connected to it.`)
	}
	const radixAppToOpenWaitPolicy = input?.radixAppToOpenWaitPolicy

	if (!radixAppToOpenWaitPolicy) {
		return Promise.resolve(transport)
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
			apdu: RadixAPDU.getAppName(),
			with: transport,
		})
			.then(response => {
				log.debug(
					`🥩 raw response: '0x${response.toString(
						'hex',
					)}' (utf8: '${response.toString('utf8')}')`,
				)
				const responseWithoutCode = response.slice(
					0,
					response.length - 2,
				)
				const responseString = responseWithoutCode.toString('utf8')
				log.debug(`🔮 response without code: ${responseString}`)
				const debugResponseEmoji =
					responseString === 'Radix' ? `✅` : '❌'
				log.debug(
					`📲 ${debugResponseEmoji} App '${responseString}' is open.`,
				)
				return Promise.resolve(transport)
			})
			.catch(_ =>
				// We MUST close the transport and reopen it for pinging to work.
				// Otherwise we get `Cannot write to hid device` forever.
				// at least from macOS Big Sur on Ledger Nano with Secure Elements version 1.6.0
				// and MCU 1.11
				transport.close().then(() =>
					__openConnection(false, transport, {
						deviceConnectionTimeout: 1_000,
						radixAppToOpenWaitPolicy: {
							// Exponential backing off...
							delayBetweenRetries: delayBetweenRetries * 1.1,
							// Decrease retry count
							retryCount: retryCount - 1,
						},
					}),
				),
			)
	}
}

export const openConnection = async (
	transport: BasicLedgerTransport,
	input?: OpenLedgerConnectionInput,
): Promise<BasicLedgerTransport> => __openConnection(true, transport, input)
