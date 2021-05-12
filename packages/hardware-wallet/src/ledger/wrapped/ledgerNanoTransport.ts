import Transport from '@ledgerhq/hw-transport'
import { APDUT, LedgerNanoTransportT, WrappedLedgerTransportT } from './_types'
import { WrappedLedgerTransport } from './wrappedTransport'
import { CreateLedgerNanoTransportInput } from '../_types'

const createWithTransportPromise = (
	transportPromise: Promise<WrappedLedgerTransportT>,
): LedgerNanoTransportT => {
	const sendAPDUCommandToDevice = (
		input: Readonly<{
			apdu: APDUT
		}>,
	): Promise<Buffer> => {
		const { apdu } = input
		const {
			cla,
			ins,
			p1,
			p2,
			data,
			requiredResponseStatusCodeFromDevice,
		} = apdu

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
	input?: CreateLedgerNanoTransportInput | undefined,
): LedgerNanoTransportT => {
	const transportPromise = Transport.create(
		input?.openTimeout,
		input?.listenTimeout,
	).then((transport_) => WrappedLedgerTransport.from(transport_))
	return createWithTransportPromise(transportPromise)
}

const withWrappedTransport = (
	wrappedTransport: WrappedLedgerTransportT,
): LedgerNanoTransportT => {
	return createWithTransportPromise(Promise.resolve(wrappedTransport))
}

export const LedgerNanoTransport = {
	create,
	withWrappedTransport,
}
