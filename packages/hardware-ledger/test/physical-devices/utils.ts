import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'

export const sendAPDU = async (
	cla: number,
	ins: number,
	p1: number,
	p2: number,
	data?: Buffer,
	statusList?: readonly number[],
) => {
	const devices = await TransportNodeHid.list()
	if (!devices[0]) {
		throw new Error('No device found.')
	}

	const transport = await TransportNodeHid.create()
	const result = await transport.send(cla, ins, p1, p2, data)
	transport.close()
	return result
}
