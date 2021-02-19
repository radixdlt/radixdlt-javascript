import {
	PrivateKey,
	privateKeyFromScalar,
	PublicKey,
	Signature,
	UnsignedMessage,
} from '@radixdlt/crypto'
import { mergeMap, map } from 'rxjs/operators'
import { Observable, of, from } from 'rxjs'
import { toObservable, toObservableFromResult } from './resultAsync_observable'
import { AccountID, AccountT, HardwareWallet } from './_types'
import { BIP32 } from './bip32/_types'
import { accountIdFromBIP32Path, accountIdFromPublicKey } from './accountId'
import { mnemonicToSeed } from 'bip39'
import { UInt256 } from '@radixdlt/uint256'
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

export const childAccountFromHDPath = (
	input: Readonly<{
		hdPath: BIP32
		rootKey: Readonly<{
			mnemonic: string
			password?: string
		}>
	}>,
): AccountT => {
	const hdNode$ = from(
		mnemonicToSeed(input.rootKey.mnemonic, input.rootKey.password),
	).pipe(map((seed) => HDNode.fromMasterSeed(seed)))
	return childAccountFromHDPathAndNode({
		hdPath: input.hdPath,
		hdNode: hdNode$,
	})
}

export const childAccountFromHDPathAndNode = (
	input: Readonly<{
		hdPath: BIP32
		hdNode: Observable<HDNode>
	}>,
): AccountT => {
	const hdKey$ = input.hdNode.pipe(
		map((n) => n.derive(input.hdPath.toString())),
	)
	const accountId = accountIdFromBIP32Path(input.hdPath)
	return accountFromHDChildAccount({ hdKey: hdKey$, accountId })
}

export const accountFromHDChildAccount = (
	input: Readonly<{ 
		hdKey: Observable<HDNode>
		accountId: AccountID 
	}>,
): AccountT => {
	const hdKey$ = input.hdKey

	const privateKey$ = hdKey$.pipe(
		mergeMap((k: HDNode) =>
			toObservableFromResult(
				privateKeyFromScalar(
					new UInt256(k.privateKey.toString('hex'), 16),
				),
			),
		),
	)

	return {
		sign: (m) =>
			privateKey$.pipe(mergeMap((pk) => toObservable(pk.sign(m)))),
		accountId: input.accountId,
		derivePublicKey: () => privateKey$.pipe(map((pk) => pk.publicKey())),
	}
}
