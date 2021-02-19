import {
	PrivateKey,
	PublicKey,
	Signature,
	UnsignedMessage,
} from '@radixdlt/crypto'
import { mergeMap } from 'rxjs/operators'
import { Observable, of } from 'rxjs'
import { toObservable } from './resultAsync_observable'
import { AccountT, HardwareWallet } from './_types'
import { BIP32 } from './bip32/_types'
import { accountIdFromBIP32Path, accountIdFromPublicKey } from './accountId'

export const accountFromPrivateKey = (privateKey: PrivateKey): AccountT => {
	const publicKey: PublicKey = privateKey.publicKey()
	const sign = (m: UnsignedMessage): Observable<Signature> =>
		toObservable(privateKey.sign(m))

	const accountId = accountIdFromPublicKey(publicKey)

	return {
		sign: sign,
		accountId: accountId,
		derivePublicKey: () => of(publicKey),
	}
}

export const accountFromHDPath = (
	input: Readonly<{
		hdPath: BIP32
		onHardwareWalletConnect: Observable<HardwareWallet>
	}>,
): AccountT => {
	const accountId = accountIdFromBIP32Path(input.hdPath)

	const hwObs = input.onHardwareWalletConnect

	return {
		sign: (unsignedMessage: UnsignedMessage): Observable<Signature> =>
			hwObs.pipe(
				mergeMap((hw: HardwareWallet) =>
					hw.sign({ unsignedMessage, hdPath: input.hdPath }),
				),
			),
		accountId: accountId,
		derivePublicKey: (): Observable<PublicKey> =>
			hwObs.pipe(
				mergeMap((hw: HardwareWallet) =>
					hw.derivePublicKey(input.hdPath),
				),
			),
	}
}
