import {
	PrivateKey,
	PublicKey,
	Signature,
	UnsignedMessage,
} from '@radixdlt/crypto'
import { mergeMap } from 'rxjs/operators'
import { Observable, of } from 'rxjs'
import { toObservable } from './resultAsync_observable'
import { AccountT, HardwareWalletSimpleT } from './_types'
import { HDMasterSeedT } from './bip39/_types'
import { HDPathRadixT } from './bip32/bip44/_types'

const fromPrivateKey = (
	privateKey: PrivateKey,
	hdPath: HDPathRadixT,
): AccountT => {
	const publicKey: PublicKey = privateKey.publicKey()
	const sign = (m: UnsignedMessage): Observable<Signature> =>
		toObservable(privateKey.sign(m))

	return {
		sign: sign,
		hdPath,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		equals: (other: any): boolean => {
			if (!isAccount(other)) return false
			return other.hdPath.equals(hdPath)
		},
		derivePublicKey: () => of(publicKey),
	}
}

const fromHDPathWithHardwareWallet = (
	input: Readonly<{
		hdPath: HDPathRadixT
		onHardwareWalletConnect: Observable<HardwareWalletSimpleT>
	}>,
): AccountT => {
	const hardwareWallet$ = input.onHardwareWalletConnect

	return {
		hdPath: input.hdPath,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		equals: (other: any): boolean => {
			if (!isAccount(other)) return false
			return other.hdPath.equals(input.hdPath)
		},
		sign: (unsignedMessage: UnsignedMessage): Observable<Signature> =>
			hardwareWallet$.pipe(
				mergeMap((hw: HardwareWalletSimpleT) =>
					hw.sign({ unsignedMessage, hdPath: input.hdPath }),
				),
			),
		derivePublicKey: (): Observable<PublicKey> =>
			hardwareWallet$.pipe(
				mergeMap((hw: HardwareWalletSimpleT) =>
					hw.derivePublicKey(input.hdPath),
				),
			),
	}
}

const fromHDPathWithHDMasterSeed = (
	input: Readonly<{
		hdPath: HDPathRadixT
		hdMasterSeed: HDMasterSeedT
	}>,
): AccountT => {
	const hdNodeAtPath = input.hdMasterSeed.masterNode().derive(input.hdPath)
	return fromPrivateKey(hdNodeAtPath.privateKey, input.hdPath)
}

export const isAccount = (something: unknown): something is AccountT => {
	const inspection = something as AccountT
	return (
		inspection.hdPath !== undefined &&
		inspection.derivePublicKey !== undefined &&
		inspection.sign !== undefined
	)
}

export const Account = {
	fromHDPathWithHardwareWallet,
	fromHDPathWithHDMasterSeed,
}
