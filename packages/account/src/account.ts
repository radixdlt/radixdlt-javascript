import {
	DiffieHellman,
	ECPointOnCurve,
	EncryptedMessageT,
	MessageEncryption,
	PrivateKey,
	PublicKey,
	Signature,
} from '@radixdlt/crypto'
import { map, mergeMap } from 'rxjs/operators'
import { Observable, of } from 'rxjs'
import { toObservable } from './resultAsync_observable'
import {
	AccountDecryptionInput,
	AccountEncryptionInput,
	AccountT,
	HardwareWalletSimpleT,
} from './_types'
import { HDMasterSeedT, HDNodeT } from './bip39'
import { HDPathRadixT } from './bip32'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { log } from '@radixdlt/util'
import { AccountAddressT } from './addresses'

const fromPrivateKey = (
	input: Readonly<{
		privateKey: PrivateKey
		hdPath: HDPathRadixT
		addressFromPublicKey: (
			publicKey: PublicKey,
		) => Observable<AccountAddressT>
	}>,
): AccountT => {
	const { privateKey, hdPath, addressFromPublicKey } = input
	const publicKey: PublicKey = privateKey.publicKey()
	const sign = (hashedMessage: Buffer): Observable<Signature> =>
		toObservable(privateKey.sign(hashedMessage))

	const diffieHellman = privateKey.diffieHellman

	return {
		decrypt: (input: AccountDecryptionInput): Observable<string> => {
			return toObservable(
				MessageEncryption.decrypt({
					...input,
					diffieHellman,
				}).map((buf: Buffer) => buf.toString('utf-8')),
			)
		},
		encrypt: (
			input: AccountEncryptionInput,
		): Observable<EncryptedMessageT> => {
			return toObservable(
				MessageEncryption.encrypt({
					...input,
					diffieHellman,
				}),
			)
		},
		sign: sign,
		hdPath,
		derivePublicKey: () => of(publicKey),
		__unsafeGetPublicKey: (): PublicKey => publicKey,
		deriveAddress: () => addressFromPublicKey(publicKey),
	}
}

const fromHDPathWithHardwareWallet = (
	input: Readonly<{
		hdPath: HDPathRadixT
		addressFromPublicKey: (
			publicKey: PublicKey,
		) => Observable<AccountAddressT>
		onHardwareWalletConnect: Observable<HardwareWalletSimpleT>
	}>,
): AccountT => {
	const {
		hdPath,
		onHardwareWalletConnect: hardwareWallet$,
		addressFromPublicKey,
	} = input

	const derivePublicKey = (): Observable<PublicKey> =>
		hardwareWallet$.pipe(
			mergeMap((hw: HardwareWalletSimpleT) => hw.derivePublicKey(hdPath)),
		)

	const dhObservable = (
		publicKeyUsedInKeyExchange: PublicKey,
	): Observable<DiffieHellman> =>
		hardwareWallet$.pipe(
			mergeMap((hw) =>
				hw.diffieHellman({
					hdPath,
					publicKeyOfOtherParty: publicKeyUsedInKeyExchange,
				}),
			),
			map(
				(dhKey: ECPointOnCurve): DiffieHellman => {
					return (
						publicKeyOfOtherParty: PublicKey,
					): ResultAsync<ECPointOnCurve, Error> => {
						if (
							!publicKeyOfOtherParty.equals(
								publicKeyUsedInKeyExchange,
							)
						) {
							log.error(
								`Mismatch betwen public key used in DH and input to this inlined DH function.`,
							)
							return errAsync(new Error('Key mismatch'))
						}
						return okAsync(dhKey)
					}
				},
			),
		)

	return {
		hdPath,
		sign: (hashedMessage): Observable<Signature> =>
			hardwareWallet$.pipe(
				mergeMap((hw: HardwareWalletSimpleT) =>
					hw.sign({ hashedMessage, hdPath }),
				),
			),
		derivePublicKey,
		deriveAddress: () =>
			derivePublicKey().pipe(
				mergeMap((pubKey) => addressFromPublicKey(pubKey)),
			),
		decrypt: (input: AccountDecryptionInput): Observable<string> => {
			return dhObservable(input.publicKeyOfOtherParty).pipe(
				mergeMap((diffieHellman: DiffieHellman) =>
					toObservable(
						MessageEncryption.decrypt({ ...input, diffieHellman }),
					),
				),
				map((b) => b.toString('utf8')),
			)
		},
		__unsafeGetPublicKey: (): PublicKey => {
			const errMsg = `Tried to unsafely sync access public key of a hardware account, which is not possible. Crashing application now.`
			log.error(errMsg)
			throw new Error(errMsg)
		},
		encrypt: (
			input: AccountEncryptionInput,
		): Observable<EncryptedMessageT> => {
			return dhObservable(input.publicKeyOfOtherParty).pipe(
				mergeMap((diffieHellman: DiffieHellman) =>
					toObservable(
						MessageEncryption.encrypt({ ...input, diffieHellman }),
					),
				),
			)
		},
	}
}

const byDerivingNodeAtPath = (
	input: Readonly<{
		hdPath: HDPathRadixT
		deriveNodeAtPath: () => HDNodeT
		addressFromPublicKey: (
			publicKey: PublicKey,
		) => Observable<AccountAddressT>
	}>,
): AccountT =>
	fromPrivateKey({
		...input,
		privateKey: input.deriveNodeAtPath().privateKey,
	})

const fromHDPathWithHDMasterNode = (
	input: Readonly<{
		hdPath: HDPathRadixT
		addressFromPublicKey: (
			publicKey: PublicKey,
		) => Observable<AccountAddressT>
		hdMasterNode: HDNodeT
	}>,
): AccountT => {
	const hdNodeAtPath = input.hdMasterNode.derive(input.hdPath)
	return fromPrivateKey({ ...input, privateKey: hdNodeAtPath.privateKey })
}

const fromHDPathWithHDMasterSeed = (
	input: Readonly<{
		hdPath: HDPathRadixT
		addressFromPublicKey: (
			publicKey: PublicKey,
		) => Observable<AccountAddressT>
		hdMasterSeed: HDMasterSeedT
	}>,
): AccountT => {
	const hdMasterNode = input.hdMasterSeed.masterNode()
	return fromHDPathWithHDMasterNode({ ...input, hdMasterNode })
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
	__unsafeFromPrivateKey: fromPrivateKey,
	byDerivingNodeAtPath,
	fromHDPathWithHardwareWallet,
	fromHDPathWithHDMasterNode,
	fromHDPathWithHDMasterSeed,
}
