import { HardwareSigningKeyT, HardwareWalletT } from './_types'
import { Observable } from 'rxjs'
import {
	ECPointOnCurveT,
	HDPathRadix,
	HDPathRadixT,
	PublicKeyT,
	SignatureT,
} from '@radixdlt/crypto'
import { map } from 'rxjs/operators'

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
				sign: (hashedMessage: Buffer): Observable<SignatureT> =>
					hardwareWallet.doSignHash({
						hashToSign: hashedMessage,
						path,
					}),
				keyExchange: (
					publicKeyOfOtherParty: PublicKeyT,
				): Observable<ECPointOnCurveT> =>
					hardwareWallet.doKeyExchange({
						displayAddress: true,
						// Too many steps for user and also not very helpful for any user.
						// But good to be able to.
						displaySharedKeyOnDevice: false,
						path,
						publicKeyOfOtherParty,
					}),
			})),
		)
