import Transport from '@ledgerhq/hw-transport'
import {
	APDUT,
	CreateLedgerNanoTransportInput,
	DeviceResponseStatusCode,
	LedgerDeviceTransport,
	LedgerNanoTransportT,
} from './_types'



const createWithTransportPromise = (
	transportPromise: Promise<LedgerDeviceTransport>,
): LedgerNanoTransportT => {
	const sendAPDUCommandToDevice = (
		input: Readonly<{
			apdu: APDUT
		}>,
	): Promise<Buffer> => {
		const { apdu } = input
		const { cla, ins, data } = apdu
		const p1 = apdu.p1 ?? 0
		const p2 = apdu.p2 ?? 0
		const requiredResponseStatusCodeFromDevice = apdu.requiredResponseStatusCodeFromDevice ?? [
			DeviceResponseStatusCode.OK,
		]
		const statusList: ReadonlyArray<number> = [
			...requiredResponseStatusCodeFromDevice.map((c) => c.valueOf()),
		]
		return transportPromise.then((transport) => {
			return transport.send(cla, ins, p1, p2, data, statusList)
		})
	}

	return {
		sendAPDUCommandToDevice,
	}
}

const create = (
	input: CreateLedgerNanoTransportInput,
): LedgerNanoTransportT => {
	const transportPromise = Transport.create(
		input.openTimeout,
		input.listenTimeout,
	)
	return createWithTransportPromise(transportPromise)
}

export const LedgerNanoTransport = {
	create,
}