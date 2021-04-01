import {
	PrivateKey,
	PublicKey,
	Signature,
	UnsignedMessage,
} from '@radixdlt/crypto'
import { mergeMap } from 'rxjs/operators'
import { Observable, of, throwError } from 'rxjs'
import { toObservable } from './resultAsync_observable'
import {
	AccountT,
	AddressT,
	EncryptedMessage,
	EncryptedMessageToDecrypt,
	EncryptionSchemeName,
	HardwareWalletSimpleT,
	PlaintextMessageToEncrypt,
} from './_types'
import { HDMasterSeedT, HDNodeT } from './bip39/_types'
import { HDPathRadixT } from './bip32/bip44/_types'

const NO_ENCRYPTION_YET_PREFIX =
	'PLAIN_TEXT_BECAUSE_ENCRYPTION_IS_NOT_YET_INPLEMENTED___'

const fromPrivateKey = (
	input: Readonly<{
		privateKey: PrivateKey
		hdPath: HDPathRadixT
		addressFromPublicKey: (publicKey: PublicKey) => Observable<AddressT>
	}>,
): AccountT => {
	const { privateKey, hdPath, addressFromPublicKey } = input
	const publicKey: PublicKey = privateKey.publicKey()
	const sign = (m: UnsignedMessage): Observable<Signature> =>
		toObservable(privateKey.sign(m))

	return {
		sign: sign,
		hdPath,
		derivePublicKey: () => of(publicKey),
		deriveAddress: () => addressFromPublicKey(publicKey),
		decrypt: (
			_encryptedMessage: EncryptedMessageToDecrypt,
		): Observable<string> => throwError(() => new Error('Imple me')),

		encrypt: (
			plaintext: PlaintextMessageToEncrypt,
		): Observable<EncryptedMessage> =>
			plaintext.encryptionScheme === EncryptionSchemeName.DO_NOT_ENCRYPT
				? of<EncryptedMessage>({
						encryptionScheme: plaintext.encryptionScheme,
						msg: `${NO_ENCRYPTION_YET_PREFIX}${plaintext.plaintext}`,
				  })
				: throwError(() => new Error('Imple me')),
	}
}

const fromHDPathWithHardwareWallet = (
	input: Readonly<{
		hdPath: HDPathRadixT
		addressFromPublicKey: (publicKey: PublicKey) => Observable<AddressT>
		onHardwareWalletConnect: Observable<HardwareWalletSimpleT>
	}>,
): AccountT => {
	const hardwareWallet$ = input.onHardwareWalletConnect

	const derivePublicKey = (): Observable<PublicKey> =>
		hardwareWallet$.pipe(
			mergeMap((hw: HardwareWalletSimpleT) =>
				hw.derivePublicKey(input.hdPath),
			),
		)

	return {
		hdPath: input.hdPath,
		sign: (unsignedMessage: UnsignedMessage): Observable<Signature> =>
			hardwareWallet$.pipe(
				mergeMap((hw: HardwareWalletSimpleT) =>
					hw.sign({ unsignedMessage, hdPath: input.hdPath }),
				),
			),
		derivePublicKey,
		deriveAddress: () =>
			derivePublicKey().pipe(
				mergeMap((pubKey) => input.addressFromPublicKey(pubKey)),
			),
		decrypt: (
			_encryptedMessage: EncryptedMessageToDecrypt,
		): Observable<string> => throwError(() => new Error('Imple me')),

		encrypt: (
			_plaintext: PlaintextMessageToEncrypt,
		): Observable<EncryptedMessage> =>
			throwError(() => new Error('Imple me')),
	}
}

const byDerivingNodeAtPath = (
	input: Readonly<{
		hdPath: HDPathRadixT
		deriveNodeAtPath: () => HDNodeT
		addressFromPublicKey: (publicKey: PublicKey) => Observable<AddressT>
	}>,
): AccountT =>
	fromPrivateKey({
		...input,
		privateKey: input.deriveNodeAtPath().privateKey,
	})

const fromHDPathWithHDMasterNode = (
	input: Readonly<{
		hdPath: HDPathRadixT
		addressFromPublicKey: (publicKey: PublicKey) => Observable<AddressT>
		hdMasterNode: HDNodeT
	}>,
): AccountT => {
	const hdNodeAtPath = input.hdMasterNode.derive(input.hdPath)
	return fromPrivateKey({ ...input, privateKey: hdNodeAtPath.privateKey })
}

const fromHDPathWithHDMasterSeed = (
	input: Readonly<{
		hdPath: HDPathRadixT
		addressFromPublicKey: (publicKey: PublicKey) => Observable<AddressT>
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
	byDerivingNodeAtPath,
	fromHDPathWithHardwareWallet,
	fromHDPathWithHDMasterNode,
	fromHDPathWithHDMasterSeed,
}
