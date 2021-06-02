import { from, Observable, throwError } from 'rxjs'
import {
	ECPointOnCurve,
	ECPointOnCurveT,
	HDPathRadixT,
	MESSAGE_TYPE_BYTES,
	PublicKey,
	PublicKeyT,
	Signature,
	SignatureT,
} from '@radixdlt/crypto'
import { map, mergeMap } from 'rxjs/operators'
import {
	msgFromError,
	readBuffer,
	toObservableFromResult,
} from '@radixdlt/util'
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
import { err } from 'neverthrow'
import { log } from '@radixdlt/util/dist/logging'

const withLedgerNano = (ledgerNano: LedgerNanoT): HardwareWalletT => {
	const getPublicKey = (input: GetPublicKeyInput): Observable<PublicKeyT> =>
		ledgerNano
			.sendAPDUToDevice(
				RadixAPDU.getPublicKey({
					path: input.path ?? path000H,
					displayAddress: input.displayAddress ?? false, // passing 'false' is convenient for testing,
					// verifyAddressOnDeviceForNetwork:
					// 	input.verifyAddressOnDeviceForNetwork,
				}),
			)
			.pipe(
				mergeMap(
					(buf): Observable<PublicKeyT> => {
						// Response `buf`: pub_key_len (1) || pub_key (var) || chain_code_len (1) || chain_code (var)
						const readNextBuffer = readBuffer(buf)

						const publicKeyLengthResult = readNextBuffer(1)
						if (publicKeyLengthResult.isErr()) {
							const errMsg = `Failed to parse length of public key from response buffer: ${msgFromError(
								publicKeyLengthResult.error,
							)}`
							log.error(errMsg)
							return throwError(new Error(errMsg))
						}
						const publicKeyLength = publicKeyLengthResult.value.readUIntBE(
							0,
							1,
						)
						const publicKeyBytesResult = readNextBuffer(
							publicKeyLength,
						)

						if (publicKeyBytesResult.isErr()) {
							const errMsg = `Failed to parse public key bytes from response buffer: ${msgFromError(
								publicKeyBytesResult.error,
							)}`
							log.error(errMsg)
							return throwError(new Error(errMsg))
						}
						const publicKeyBytes = publicKeyBytesResult.value

						// We ignore remaining bytes, being: `chain_code_len (1) || chain_code (var)`

						return toObservableFromResult(
							PublicKey.fromBuffer(publicKeyBytes),
						)
					},
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
					displayAddress: input.displayAddress ?? false,
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
					displayAddress: input.displayAddress ?? false,
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
