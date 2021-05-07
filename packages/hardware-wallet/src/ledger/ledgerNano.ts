import { LedgerNanoTransport } from './wrapped/ledgerNanoTransport'
import {
	CreateLedgerNanoTransportInput,
	LedgerNanoT,
	RadixAPDUT,
} from './_types'
import { from, Observable } from 'rxjs'
import { LedgerNanoTransportT, WrappedLedgerTransportT } from './wrapped'

const createWithTransport = (transport: LedgerNanoTransportT): LedgerNanoT => {
	const sendAPDUCommandToDevice = (
		input: Readonly<{
			apdu: RadixAPDUT
		}>,
	): Observable<Buffer> => {
		return from(transport.sendAPDUCommandToDevice(input))
	}

	return {
		sendAPDUCommandToDevice,
	}
}

const create = (input: CreateLedgerNanoTransportInput): LedgerNanoT => {
	const transport = LedgerNanoTransport.create(input)
	return createWithTransport(transport)
}

const mock = (wrappedTransport: WrappedLedgerTransportT): LedgerNanoT => {
	return createWithTransport(
		LedgerNanoTransport.withWrappedTransport(wrappedTransport),
	)
}

export const LedgerNano = {
	create,
	mock,
}
