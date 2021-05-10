import { LedgerNanoTransport } from './wrapped/ledgerNanoTransport'
import {
	CreateLedgerNanoTransportInput,
	LedgerNanoT,
	LedgerRequest,
	LedgerResponse,
	MockedLedgerNanoRecorderT,
	MockedLedgerNanoT,
	RadixAPDUT,
} from './_types'
import { from, Observable } from 'rxjs'
import { LedgerNanoTransportT, WrappedLedgerTransportT } from './wrapped'
import { MnemomicT, Mnemonic } from '@radixdlt/account'
import { map, tap } from 'rxjs/operators'
import { v4 as uuidv4 } from 'uuid'
import { WrappedLedgerTransport } from './wrapped/wrappedTransport'
import { MockedLedgerNanoRecorder } from './mockedLedgerNanoRecorder'

const createWithTransport = (
	input: Readonly<{
		transport: LedgerNanoTransportT
		recorder?: MockedLedgerNanoRecorderT
	}>,
): LedgerNanoT => {
	const { recorder, transport } = input

	const sendRequestToDevice = (
		request: LedgerRequest,
	): Observable<LedgerResponse> => {
		const { uuid, apdu } = request
		recorder?.recordRequest(request)
		return from(transport.sendAPDUCommandToDevice({ apdu })).pipe(
			map((data) => ({ data, uuid })),
			tap((response) => {
				recorder?.recordResponse(response)
			}),
		)
	}

	const sendAPDUToDevice = (apdu: RadixAPDUT): Observable<Buffer> => {
		const uuid = uuidv4()
		return sendRequestToDevice({ apdu, uuid }).pipe(
			map((response) => response.data),
		)
	}

	return {
		__sendRequestToDevice: sendRequestToDevice,
		sendAPDUToDevice,
	}
}

const create = (input: CreateLedgerNanoTransportInput): LedgerNanoT => {
	const transport = LedgerNanoTransport.create(input)
	return createWithTransport({ transport })
}

const wrappedTransport = (transport: WrappedLedgerTransportT): LedgerNanoT => {
	return createWithTransport({
		transport: LedgerNanoTransport.withWrappedTransport(transport),
	})
}

const emulate = (
	input: Readonly<{
		recorder?: MockedLedgerNanoRecorderT
		mnemonic?: MnemomicT
		passphrase?: string
	}>,
): MockedLedgerNanoT => {
	const passphrase = input.passphrase
	const mnemonic = input.mnemonic ?? Mnemonic.generateNew()

	const recorder = input.recorder ?? MockedLedgerNanoRecorder.create()

	const emulatedTransport = WrappedLedgerTransport.emulate({
		...input,
		recorder,
		mnemonic,
		passphrase,
	})
	const transport: LedgerNanoTransportT = LedgerNanoTransport.withWrappedTransport(
		emulatedTransport,
	)

	const ledgerNano = createWithTransport({
		transport,
		recorder: recorder,
	})

	return {
		...ledgerNano,
		store: recorder,
	}
}

export const LedgerNano = {
	create,
	wrappedTransport,
	emulate,
}
