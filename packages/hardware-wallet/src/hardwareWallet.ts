import {
	GetPublicKeyInput,
	HardwareSigningKeyT,
	HardwareWalletT,
	KeyExchangeInput,
	SemVerT,
	SignHashInput,
} from './_types'
import { LedgerNanoT, SemVer, RadixAPDU } from './ledger'
import { Observable } from 'rxjs'
import {
	ECPointOnCurve,
	ECPointOnCurveT,
	HDPathRadix,
	HDPathRadixT,
	PublicKey,
	PublicKeyT,
	SignatureT,
} from '@radixdlt/crypto'
import { map, mergeMap } from 'rxjs/operators'
import { Signature } from '@radixdlt/crypto'
import { toObservableFromResult } from '@radixdlt/util'

const path000H = HDPathRadix.create({ address: { index: 0, isHardened: true } })

type HardwareWalletWithoutSK = Omit<HardwareWalletT, 'makeSigningKey'>

const signingKeyWithHardWareWallet = (
	hardwareWallet: HardwareWalletWithoutSK,
	path: HDPathRadixT,
): Observable<HardwareSigningKeyT> =>
	hardwareWallet
		.getPublicKey({
			path,
			requireConfirmationOnDevice: true,
		})
		.pipe(
			map((publicKey: PublicKeyT) => ({
				publicKey,
				sign: (hashedMessage: Buffer): Observable<SignatureT> =>
					hardwareWallet.doSignHash({
						hashToSign: hashedMessage,
						path,
					}),
				keyExchange: (
					publicKeyOfOtherParty: PublicKeyT,
				): Observable<ECPointOnCurveT> =>
					hardwareWallet.doKeyExchange({
						requireConfirmationOnDevice: true,
						// Too many steps for user and also not very helpful for any user.
						// But good to be able to.
						displaySharedKeyOnDevice: false,
						path,
						publicKeyOfOtherParty,
					}),
			})),
		)

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

export const HardwareWallet = {
	ledger: withLedgerNano,
}
