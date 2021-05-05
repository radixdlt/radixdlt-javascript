import Transport, { Descriptor } from '@ledgerhq/hw-transport'
import {
	APDUT,
	CreateLedgerNanoTransportInput,
	DeviceResponseStatusCode,
	LedgerNanoTransportT,
} from './_types'

const createLedgerNanoTransportWithTransportPromise = (
	transportPromise: Promise<Transport<Descriptor>>,
	input: CreateLedgerNanoTransportInput,
): LedgerNanoTransportT => {
	const transportPromise = Transport.create(
		input.openTimeout,
		input.listenTimeout,
	)

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

const createLedgerNanoTransport = (
	input: CreateLedgerNanoTransportInput,
): LedgerNanoTransportT => {
	const transportPromise = Transport.create(
		input.openTimeout,
		input.listenTimeout,
	)
	return createLedgerNanoTransportWithTransportPromise(
		transportPromise,
		input,
	)
}

const withMockedTransport = (): LedgerNanoTransportT => {
	// createLedgerNanoTransportWithTransportPromise
}

export const LedgerNanoTransport = {
	create: createLedgerNanoTransport,

	// Used by tests.
	__withMockedTransport: createLedgerNanoTransportWithTransportPromise,
}


/*
*  const store = RecordStore.fromString(`
    => e016000000
    <= 000000050107426974636f696e034254439000
  `);
  const Transport = createTransportReplayer(store);
* */