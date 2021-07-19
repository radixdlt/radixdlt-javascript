import { log } from '@radixdlt/util'
import { ConnectionEvent, Device, LedgerResponseCodes, RadixAPDUT } from './_types'
import { Subscription } from 'rxjs'

export type BasicLedgerTransport = Readonly<{
	close: () => Promise<void>
	send: (
		cla: number,
		ins: number,
		p1: number,
		p2: number,
		data?: Buffer,
		statusList?: ReadonlyArray<number>,
	) => Promise<Buffer>,
	listen: ({
		next
	}: {
		next: (obj: ConnectionEvent) => Promise<void>
	}) => Promise<Subscription>,
	list: () => Promise<string[]>,
	open: (device: string) => Promise<Device>

}>

export const send = async (
	input: Readonly<{
		apdu: RadixAPDUT
		with: BasicLedgerTransport
	}>,
): Promise<Buffer> => {
	const { apdu, with: connectedLedgerTransport } = input
	
	const device = await openConnection(connectedLedgerTransport)

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
		
	return device.send(
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

export const subscribeDeviceConnection = async (transport: BasicLedgerTransport, next: (isConnected: boolean) => any): Promise<Subscription> =>
    transport.listen({
        next: async (obj: ConnectionEvent) => {
            switch (obj.type) {
                case 'add':
                    next(true)
                    break
                case 'remove':
                    next(false)
                    break
            }
        },
    })

const openConnection = async (transport: BasicLedgerTransport): Promise<Device> => {
    const devices = await transport.list()

    if (!devices[0]) { throw new Error('No device found.') }
    return transport.open(devices[0])
}