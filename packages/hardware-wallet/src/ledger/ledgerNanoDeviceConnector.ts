import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'
import { Subscription as LedgerSubscriptionType } from '@ledgerhq/hw-transport'
import { isNode } from '@radixdlt/util'

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

export type BasicLedgerTransport = Pick<TransportNodeHid, 'send' | 'device'>

// export type ConnEvent = {
// 	type: 'add' | 'remove'
// 	descriptor: string
// 	deviceModel: string
// 	// eslint-disable-next-line @typescript-eslint/no-explicit-any
// 	device: any
// }

let transportNodeHid: typeof TransportNodeHid
let outResolve: () => void

const isImported: Promise<void> = new Promise(async (resolve, _) => {
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

/*
    Subscribes to events that fire when the Ledger device has connected/disconnected.
*/
const subscribeDeviceConnection = async (
	next: (isConnected: boolean) => void,
): Promise<LedgerSubscriptionType> => {
	await isImported

	return transportNodeHid.listen({
		next: (event) => {
			console.log(`🔮 next event: ${JSON.stringify(event, null, 4)}`)
			switch (event.type) {
				case 'add':
					next(true)
					break
				case 'remove':
					next(false)
					break
			}
		},
		error: (error) => {
			console.log(`🔮 error: ${error}`)
			next(false)
		},
		complete: () => {
			console.log(`🔮 complete`)
			next(false)
		},
		// next: async (obj: ConnEvent) => {
		// 	switch (obj.type) {
		// 		case 'add':
		// 			next(true)
		// 			break
		// 		case 'remove':
		// 			next(false)
		// 			break
		// 	}
		// },
	})
}

export const openConnection = async (): Promise<BasicLedgerTransport> => {
	await isImported

	const devices = await transportNodeHid.list()

	if (!devices[0]) {
		throw new Error('No device found.')
	}
	return transportNodeHid.open(devices[0])
}
