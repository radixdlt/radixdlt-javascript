import {
	PrivateKey,
	privateKeyFromBuffer,
	PublicKey,
	Signature,
	UnsignedMessage,
} from '@radixdlt/crypto'
import { mergeMap, map } from 'rxjs/operators'
import { Observable, of, from } from 'rxjs'
import { toObservable, toObservableFromResult } from './resultAsync_observable'
import { AccountT, HardwareWallet } from './_types'
import { BIP32 } from './bip32/_types'
import { accountIdFromBIP32Path, accountIdFromPublicKey } from './accountId'
import { mnemonicToSeed } from 'bip39'
import HDNode = require('hdkey')

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

export const hwAccountFromHDPath = (
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

export const accountFromMnemonicAtHDPath = (
	input: Readonly<{
		mnemonic: Readonly<{
			phrase: string
			password?: string
		}>
		hdPath: BIP32
	}>,
): AccountT => {
	const hdNode$ = from(
		mnemonicToSeed(input.mnemonic.phrase, input.mnemonic.password),
	).pipe(map((seed) => HDNode.fromMasterSeed(seed)))
	return accountFromHDNodeAtHDPath({
		hdNode: hdNode$,
		hdPath: input.hdPath,
	})
}

export const accountFromHDNodeAtHDPath = (
	input: Readonly<{
		hdNode: Observable<HDNode>
		hdPath: BIP32
	}>,
): AccountT => {
	const hdNode$ = input.hdNode.pipe(
		map((n) => n.derive(input.hdPath.toString())),
	)

	const privateKey$ = hdNode$.pipe(
		mergeMap((k: HDNode) =>
			toObservableFromResult(privateKeyFromBuffer(k.privateKey)),
		),
	)

	return {
		accountId: accountIdFromBIP32Path(input.hdPath),
		sign: (m) =>
			privateKey$.pipe(mergeMap((pk) => toObservable(pk.sign(m)))),
		derivePublicKey: () => privateKey$.pipe(map((pk) => pk.publicKey())),
	}
}
