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
import { BIP32T } from './bip32/_types'
import { AccountId } from './accountId'
import { HDMasterSeedT, HDNodeT } from './bip39/_types'

const fromPrivateKey = (privateKey: PrivateKey): AccountT => {
	const publicKey: PublicKey = privateKey.publicKey()
	const sign = (m: UnsignedMessage): Observable<Signature> =>
		toObservable(privateKey.sign(m))

	const accountId = AccountId.create(publicKey)

	return {
		sign: sign,
		accountId: accountId,
		derivePublicKey: () => of(publicKey),
	}
}

const fromHDPathWithHardwareWallet = (
	input: Readonly<{
		hdPath: BIP32T
		onHardwareWalletConnect: Observable<HardwareWallet>
	}>,
): AccountT => {
	const accountId = AccountId.create(input.hdPath)

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

const fromHDPathWithHDMasterSeed = (
	input: Readonly<{
		hdPath: BIP32T
		hdMasterSeed: HDMasterSeedT
	}>,
): AccountT => {
	const hdNodeAtPath = input.hdMasterSeed.masterNode().derive(input.hdPath)
	return {
		...fromPrivateKey(hdNodeAtPath.privateKey),
		accountId: AccountId.create(input.hdPath),
	}
}

export const Account = {
	fromPrivateKey,
	fromHDPathWithHardwareWallet,
	fromHDPathWithHDMasterSeed,
}
