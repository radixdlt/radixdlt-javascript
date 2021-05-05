import { from, Observable } from 'rxjs'
import { LedgerNanoTransport } from './ledgerNanoTransport'
import {
	CreateLedgerNanoTransportInput,
	LedgerNanoT,
	RadixAPDUT,
} from './_types'

const createLedgerNano = (
	input: CreateLedgerNanoTransportInput,
): LedgerNanoT => {
	const ledgerNanoTransport_ = LedgerNanoTransport.create(input)

	const sendAPDUCommandToDevice = (
		input: Readonly<{
			apdu: RadixAPDUT
		}>,
	): Observable<Buffer> => {
		return from(ledgerNanoTransport_.sendAPDUCommandToDevice(input))
	}

	return {
		sendAPDUCommandToDevice,
	}
}

export const LedgerNano = {
	create: createLedgerNano,
}
