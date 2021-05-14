import {
	GetPublicKeyInput,
	HardwareWalletDeviceConnectionStatus,
	HardwareWalletT,
	KeyExchangeInput,
	SemVerT,
	SignHashInput,
} from './_types'
import { LedgerNanoT } from './ledger'
import { Observable, throwError } from 'rxjs'
import {
	ECPointOnCurve,
	ECPointOnCurveT,
	PublicKey,
	PublicKeyT,
	SignatureT,
} from '@radixdlt/crypto'
import { RadixAPDU } from './ledger/apdu'
import { HDPathRadix, toObservableFromResult } from '@radixdlt/account'
import { mergeMap } from 'rxjs/operators'
import { SemVer } from './ledger/semVer'
import { Signature } from '@radixdlt/crypto/dist/elliptic-curve/signature'

const path000H = HDPathRadix.create({ address: { index: 0, isHardened: true } })

const withLedgerNano = (ledgerNano: LedgerNanoT): HardwareWalletT => {
	const getPublicKey = (input: GetPublicKeyInput): Observable<PublicKeyT> => {
		return ledgerNano
			.sendAPDUToDevice(
				RadixAPDU.getPublicKey({
					path: input.path ?? path000H,
					requireConfirmationOnDevice:
						input.requireConfirmationOnDevice ?? false, // passing 'false' is convenient for testing
				}),
			)
			.pipe(
				mergeMap((buf) =>
					toObservableFromResult(PublicKey.fromBuffer(buf)),
				),
			)
	}

	const getVersion = (): Observable<SemVerT> => {
		return ledgerNano
			.sendAPDUToDevice(RadixAPDU.getVersion())
			.pipe(
				mergeMap((buf) =>
					toObservableFromResult(SemVer.fromBuffer(buf)),
				),
			)
	}

	const deviceConnectionStatus: Observable<HardwareWalletDeviceConnectionStatus> = throwError(
		new Error('not impl'),
	)

	const doSignHash = (input: SignHashInput): Observable<SignatureT> => {
		return ledgerNano
			.sendAPDUToDevice(
				RadixAPDU.doSignHash({
					path: input.path ?? path000H,
					requireConfirmationOnDevice:
						input.requireConfirmationOnDevice ?? false,
					hashToSign: input.hashToSign,
				}),
			)
			.pipe(
				mergeMap((buf) =>
					toObservableFromResult(Signature.fromRSBuffer(buf)),
				),
			)
	}

	const doKeyExchange = (
		input: KeyExchangeInput,
	): Observable<ECPointOnCurveT> => {
		return ledgerNano
			.sendAPDUToDevice(
				RadixAPDU.doKeyExchange({
					...input,
					path: input.path ?? path000H,
					requireConfirmationOnDevice:
						input.requireConfirmationOnDevice ?? false,
				}),
			)
			.pipe(
				mergeMap((buf) =>
					toObservableFromResult(ECPointOnCurve.fromBuffer(buf)),
				),
			)
	}

	return {
		deviceConnectionStatus,
		getPublicKey,
		getVersion,
		doSignHash,
		doKeyExchange,
	}
}

export const HardwareWallet = {
	ledger: withLedgerNano,
}
