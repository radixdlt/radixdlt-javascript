import { HardwareSigningKeyT, HardwareWalletT, SignHashInput } from './_types'
import { Observable } from 'rxjs'
import {
	ECPointOnCurveT,
	HDPathRadix,
	HDPathRadixT,
	PublicKeyT,
	SignatureT,
} from '@radixdlt/crypto'
import { map } from 'rxjs/operators'
import { BuiltTransactionReadyToSign } from '@radixdlt/primitives'

export const path000H = HDPathRadix.create({
	address: { index: 0, isHardened: true },
})

export type HardwareWalletWithoutSK = Omit<HardwareWalletT, 'makeSigningKey'>

export const signingKeyWithHardWareWallet = (
	hardwareWallet: HardwareWalletWithoutSK,
	path: HDPathRadixT,
): Observable<HardwareSigningKeyT> =>
	hardwareWallet
		.getPublicKey({
			path,
			displayAddress: true,
		})
		.pipe(
			map((publicKey: PublicKeyT) => ({
				publicKey,
				signHash: (hashedMessage: Buffer): Observable<SignatureT> =>
					hardwareWallet.doSignHash({
						hashToSign: hashedMessage,
						path,
					}),
				sign: (
					tx: BuiltTransactionReadyToSign,
					nonXrdHRP?: string,
				): Observable<SignatureT> =>
					hardwareWallet
						.doSignTransaction({ tx, path, nonXrdHRP })
						.pipe(map(o => o.signature)),
				keyExchange: (
					publicKeyOfOtherParty: PublicKeyT,
				): Observable<ECPointOnCurveT> =>
					hardwareWallet.doKeyExchange({
						displayBIPAndPubKeyOtherParty: true,
						path,
						publicKeyOfOtherParty,
					}),
			})),
		)
