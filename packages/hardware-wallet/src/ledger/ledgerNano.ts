import { from, Observable } from 'rxjs'
import {
	CreateLedgerNanoTransportInput,
	LedgerNanoT,
	RadixAPDUT,
} from './_types'
import { LedgerNanoTransport } from './ledgerNanoTransport'

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
