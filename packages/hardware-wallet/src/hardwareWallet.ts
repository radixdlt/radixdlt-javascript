import {
	GetPublicKeyInput,
	HardwareWalletDeviceConnectionStatus,
	HardwareWalletT,
	KeyExchangeInput,
	SemVerT,
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
import { SemVer } from './ledger/semVer'
import { err, Result } from 'neverthrow'

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

	const getVersion = (): Observable<SemVerT> => {
		return ledgerNano
			.sendAPDUToDevice(RadixAPDU.getVersion())
			.pipe(mergeMap((buf) => toObservableFromResult(SemVer.from(buf))))
	}

	const deviceConnectionStatus: Observable<HardwareWalletDeviceConnectionStatus> = throwError(
		new Error('not impl'),
	)
	const doSign = (_input: SignInput): Observable<Signature> =>
		throwError(new Error('not impl'))
	const doKeyExchange = (
		_input: KeyExchangeInput,
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
