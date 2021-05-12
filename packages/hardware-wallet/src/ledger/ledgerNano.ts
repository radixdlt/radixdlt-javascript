import {
	LedgerNanoT,
	LedgerRequest,
	LedgerResponse,
	MockedLedgerNanoRecorderT,
	MockedLedgerNanoT,
	RadixAPDUT,
} from './_types'
import { Observable } from 'rxjs'
import { HDMasterSeed, HDNodeT, MnemomicT, Mnemonic } from '@radixdlt/account'
import { map, tap } from 'rxjs/operators'
import { v4 as uuidv4 } from 'uuid'
import { MockedLedgerNanoRecorder } from './mockedLedgerNanoRecorder'
import { SemVerT } from '../_types'
import { emulateSend, LedgerButtonPress } from './emulatedLedger'
import { SemVer } from './semVer'

const __create = (
	input: Readonly<{
		sendAPDUToDevice: (apdu: RadixAPDUT) => Observable<Buffer>
		recorder?: MockedLedgerNanoRecorderT
	}>,
): LedgerNanoT => {
	const { recorder, sendAPDUToDevice: exchange } = input

	const sendRequestToDevice = (
		request: LedgerRequest,
	): Observable<LedgerResponse> => {
		const { uuid, apdu } = request
		recorder?.recordRequest(request)
		return exchange(apdu).pipe(
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

const emulate = (
	input: Readonly<{
		recorder?: MockedLedgerNanoRecorderT
		mnemonic?: MnemomicT
		passphrase?: string
		version?: SemVerT
	}>,
): MockedLedgerNanoT => {
	const passphrase = input.passphrase
	const mnemonic = input.mnemonic ?? Mnemonic.generateNew()

	const recorder = input.recorder ?? MockedLedgerNanoRecorder.create()

	const sendAPDUToDevice = emulateSend({
		recorder,
		hdMasterNode: HDMasterSeed.fromMnemonic({
			mnemonic,
			passphrase,
		}).masterNode(),
		hardcodedVersion:
			input.version ?? SemVer.fromString('0.0.1')._unsafeUnwrap(),
	})

	const ledgerNano = __create({
		sendAPDUToDevice,
		recorder: recorder,
	})

	return {
		...ledgerNano,
		store: recorder,
	}
}

const waitForDeviceToConnect = async (
	timeout?: number,
): Promise<LedgerNanoT> => {
	return Promise.reject(new Error('not impl yet'))
}

export const LedgerNano = {
	waitForDeviceToConnect,
	emulate,
}
