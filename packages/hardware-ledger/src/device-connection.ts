import { log } from '@radixdlt/util'
import { LedgerResponseCodes, RadixAPDUT } from './_types'

export type BasicLedgerTransport = Readonly<{
	send: (
		cla: number,
		ins: number,
		p1: number,
		p2: number,
		data?: Buffer,
		statusList?: ReadonlyArray<number>,
	) => Promise<Buffer>
}>

export const send = async (
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

export type OpenLedgerConnectionInput = Readonly<{
	deviceConnectionTimeout?: number
	radixAppToOpenWaitPolicy?: Readonly<{
		retryCount: number
		delayBetweenRetries: number
	}>
}>