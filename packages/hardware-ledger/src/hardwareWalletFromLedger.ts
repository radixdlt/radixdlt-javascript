import { from, Observable } from 'rxjs'
import {
	ECPointOnCurve,
	ECPointOnCurveT,
	HDPathRadixT,
	PublicKey,
	PublicKeyT,
	Signature,
	SignatureT,
} from '@radixdlt/crypto'
import { map, mergeMap } from 'rxjs/operators'
import { toObservableFromResult } from '@radixdlt/util'
import {
	GetPublicKeyInput,
	HardwareSigningKeyT,
	HardwareWalletT,
	HardwareWalletWithoutSK,
	KeyExchangeInput,
	path000H,
	SemVerT,
	SignHashInput,
	SemVer,
	signingKeyWithHardWareWallet,
} from '@radixdlt/hardware-wallet'
import { RadixAPDU } from './apdu'
import { LedgerNanoT } from './_types'
import { LedgerNano } from './ledgerNano'

const withLedgerNano = (ledgerNano: LedgerNanoT): HardwareWalletT => {
	const getPublicKey = (input: GetPublicKeyInput): Observable<PublicKeyT> =>
		ledgerNano
			.sendAPDUToDevice(
				RadixAPDU.getPublicKey({
					path: input.path ?? path000H,
					requireConfirmationOnDevice:
						input.requireConfirmationOnDevice ?? false, // passing 'false' is convenient for testing,
					verifyAddressOnDeviceForNetwork:
						input.verifyAddressOnDeviceForNetwork,
				}),
			)
			.pipe(
				mergeMap(buf =>
					toObservableFromResult(PublicKey.fromBuffer(buf)),
				),
			)

	const getVersion = (): Observable<SemVerT> =>
		ledgerNano
			.sendAPDUToDevice(RadixAPDU.getVersion())
			.pipe(
				mergeMap(buf => toObservableFromResult(SemVer.fromBuffer(buf))),
			)

	const doSignHash = (input: SignHashInput): Observable<SignatureT> =>
		ledgerNano
			.sendAPDUToDevice(
				RadixAPDU.doSignHash({
					path: input.path ?? path000H,
					requireConfirmationOnDevice:
						input.requireConfirmationOnDevice ?? false,
					hashToSign: input.hashToSign,
				}),
			)
			.pipe(
				mergeMap(buf =>
					toObservableFromResult(Signature.fromRSBuffer(buf)),
				),
			)

	const doKeyExchange = (
		input: KeyExchangeInput,
	): Observable<ECPointOnCurveT> =>
		ledgerNano
			.sendAPDUToDevice(
				RadixAPDU.doKeyExchange({
					...input,
					path: input.path ?? path000H,
					requireConfirmationOnDevice:
						input.requireConfirmationOnDevice ?? false,
					displaySharedKeyOnDevice: input.displaySharedKeyOnDevice,
				}),
			)
			.pipe(
				mergeMap(buf =>
					toObservableFromResult(ECPointOnCurve.fromBuffer(buf)),
				),
			)

	const hwWithoutSK: HardwareWalletWithoutSK = {
		getPublicKey,
		getVersion,
		doSignHash,
		doKeyExchange,
	}

	return {
		...hwWithoutSK,
		makeSigningKey: (path: HDPathRadixT): Observable<HardwareSigningKeyT> =>
			signingKeyWithHardWareWallet(hwWithoutSK, path),
	}
}

const create = (): Observable<HardwareWalletT> => {
	const ledgerNano$ = from(
		LedgerNano.connect({
			// 2 minutes timeout arbitrarily chosen
			deviceConnectionTimeout: 2 * 60 * 1_000,
		}),
	)

	return ledgerNano$.pipe(
		map((ledger: LedgerNanoT) => withLedgerNano(ledger)),
	)
}

export const HardwareWalletLedger = {
	create,
	from: withLedgerNano,
}
