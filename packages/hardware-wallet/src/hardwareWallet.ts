/*
* export type HardwareWalletT = Readonly<{
	deviceConnectionStatus: Observable<HardwareWalletDeviceConnectionStatus>
	getVersion: () => Observable<SemVer>
	getPublicKey: (input: AtPath) => Observable<PublicKey>
	doSign: (input: SignInput) => Observable<Signature>
	doKeyExchange: (input: KeyExchangeInput) => Observable<ECPointOnCurve>
}>

* */

import {
	AtPath,
	GetPublicKeyInput,
	HardwareWalletDeviceConnectionStatus,
	HardwareWalletT,
	KeyExchangeInput,
	SemVer,
	SignInput,
} from './_types'
import { LedgerNanoT } from './ledger'
import { Observable, throwError } from 'rxjs'
import {
	ECPointOnCurve,
	PublicKey,
	publicKeyFromBytes,
	Signature,
} from '@radixdlt/crypto'
import { RadixAPDU } from './ledger/apdu'
import { HDPathRadix, toObservableFromResult } from '@radixdlt/account'
import { mergeMap } from 'rxjs/operators'

const path000H = HDPathRadix.create({ address: { index: 0, isHardened: true } })

const withLedgerNano = (ledgerNano: LedgerNanoT): HardwareWalletT => {
	const getPublicKey = (input: GetPublicKeyInput): Observable<PublicKey> => {
		return ledgerNano
			.sendAPDUToDevice(
				RadixAPDU.getPublicKey({
					hdPath: input.path ?? path000H,
					requireConfirmationOnDevice:
						input.requireConfirmationOnDevice ?? false, // passing 'false' is convenient for testing
				}),
			)
			.pipe(
				mergeMap((buf) =>
					toObservableFromResult(publicKeyFromBytes(buf)),
				),
			)
	}

	const getVersion = (): Observable<SemVer> =>
		throwError(new Error('not impl'))
	const deviceConnectionStatus: Observable<HardwareWalletDeviceConnectionStatus> = throwError(
		new Error('not impl'),
	)
	const doSign = (input: SignInput): Observable<Signature> =>
		throwError(new Error('not impl'))
	const doKeyExchange = (
		input: KeyExchangeInput,
	): Observable<ECPointOnCurve> => throwError(new Error('not impl'))

	return {
		deviceConnectionStatus,
		getPublicKey,
		getVersion,
		doSign,
		doKeyExchange,
	}
}

export const HardwareWallet = {
	ledger: withLedgerNano,
}
