import {
	DiffieHellman,
	ECPointOnCurve,
	EncryptedMessageT,
	isPublicKey,
	MessageEncryption,
	PrivateKey,
	PublicKey,
	Signature,
} from '@radixdlt/crypto'
import { map, mergeMap } from 'rxjs/operators'
import { Observable } from 'rxjs'
import { toObservable } from './resultAsync_observable'
import {
	AccountDecryptionInput,
	AccountEncryptionInput,
	AccountT,
	AccountTypeHDT,
	AccountTypeIdentifier,
	AccountTypeNonHDT,
	AccountTypeT,
	HardwareWalletSimpleT,
	HDAccountTypeIdentifier,
} from './_types'
import { HDMasterSeedT, HDNodeT } from './bip39'
import { HDPathRadixT } from './bip32'
import { okAsync, ResultAsync } from 'neverthrow'
import { Option } from 'prelude-ts'

const stringifyAccount = (account: AccountT): string => {
	return `
		type: ${account.type.typeIdentifier.toString()},
		publicKey: ${account.publicKey.toString(true)},
		hdPath?: ${Option.of<HDPathRadixT>(account.hdPath)
			.map((hdp) => hdp.toString())
			.getOrElse('NONE')},
		isHDAccount: ${account.isHDAccount ? 'YES' : 'NO'},
		isHardwareAccount: ${account.isHardwareAccount ? 'YES' : 'NO'},
	`
}

const makeAccountTypeHD = (
	input: Readonly<{
		hdPath: HDPathRadixT
		hdAccountType: HDAccountTypeIdentifier
	}>,
): AccountTypeHDT => {
	const { hdPath, hdAccountType } = input
	const isHardwareAccount =
		hdAccountType === HDAccountTypeIdentifier.HARDWARE_OR_REMOTE
	const uniqueKey = `${
		isHardwareAccount ? 'Hardware' : 'Local'
	}_HDaccount_at_path_${hdPath.toString()}`
	return {
		typeIdentifier: AccountTypeIdentifier.HD_ACCOUNT,
		hdAccountType,
		hdPath,
		uniqueKey,
		isHDAccount: true,
		isHardwareAccount,
	}
}

const makeAccountTypeNonHD = (
	input: Readonly<{
		publicKey: PublicKey
		name?: string
	}>,
): AccountTypeNonHDT => {
	const named = Option.of(input.name)
		.map((n) => `named_${n}`)
		.getOrElse('')
	const uniqueKey = `Non_hd_${named}pubKey${input.publicKey.toString(true)}`
	return {
		typeIdentifier: AccountTypeIdentifier.NON_HD_ACCOUNT,
		uniqueKey,
		isHDAccount: false,
		isHardwareAccount: false,
		name: input.name,
	}
}

type Decrypt = (input: AccountDecryptionInput) => Observable<string>
type Encrypt = (input: AccountEncryptionInput) => Observable<EncryptedMessageT>

const makeDecrypt = (diffieHellman: DiffieHellman): Decrypt => {
	return (input: AccountDecryptionInput): Observable<string> => {
		return toObservable(
			MessageEncryption.decrypt({
				...input,
				diffieHellman,
			}).map((buf: Buffer) => buf.toString('utf-8')),
		)
	}
}

const makeEncrypt = (diffieHellman: DiffieHellman): Encrypt => {
	return (input: AccountEncryptionInput): Observable<EncryptedMessageT> => {
		return toObservable(
			MessageEncryption.encrypt({
				...input,
				diffieHellman,
			}),
		)
	}
}

const makeDHFromPoint = (
	dhPoint: ECPointOnCurve,
	otherPubKey: PublicKey,
): DiffieHellman => {
	return (
		publicKeyOfOtherParty: PublicKey,
	): ResultAsync<ECPointOnCurve, Error> => {
		if (!publicKeyOfOtherParty.equals(otherPubKey)) {
			throw new Error(
				`Incorrect implementation, expected 'publicKeyOfOtherParty' to match 'otherPubKey'`,
			)
		}
		return okAsync(dhPoint)
	}
}

const makeEncryptHW = (
	hardwareWalletSimple: HardwareWalletSimpleT,
	hdPath: HDPathRadixT,
): Encrypt => {
	return (input: AccountEncryptionInput): Observable<EncryptedMessageT> => {
		return hardwareWalletSimple
			.diffieHellman({
				hdPath,
				publicKeyOfOtherParty: input.publicKeyOfOtherParty,
			})
			.pipe(
				mergeMap((dhPoint: ECPointOnCurve) =>
					toObservable(
						MessageEncryption.encrypt({
							plaintext: input.plaintext,
							publicKeyOfOtherParty: input.publicKeyOfOtherParty,
							diffieHellman: makeDHFromPoint(
								dhPoint,
								input.publicKeyOfOtherParty,
							),
						}),
					),
				),
			)
	}
}

const makeDecryptHW = (
	hardwareWalletSimple: HardwareWalletSimpleT,
	hdPath: HDPathRadixT,
): Decrypt => {
	return (input: AccountDecryptionInput): Observable<string> => {
		return hardwareWalletSimple
			.diffieHellman({
				hdPath,
				publicKeyOfOtherParty: input.publicKeyOfOtherParty,
			})
			.pipe(
				mergeMap((dhPoint: ECPointOnCurve) =>
					toObservable(
						MessageEncryption.decrypt({
							encryptedMessage: input.encryptedMessage,
							publicKeyOfOtherParty: input.publicKeyOfOtherParty,
							diffieHellman: makeDHFromPoint(
								dhPoint,
								input.publicKeyOfOtherParty,
							),
						}),
					),
				),
				map((b) => b.toString('utf8')),
			)
	}
}

const fromPrivateKeyAtHDPath = (
	input: Readonly<{
		privateKey: PrivateKey
		hdPath: HDPathRadixT
	}>,
): AccountT => {
	const { privateKey, hdPath } = input
	const publicKey: PublicKey = privateKey.publicKey()
	const sign = (hashedMessage: Buffer): Observable<Signature> =>
		toObservable(privateKey.sign(hashedMessage))

	const diffieHellman = privateKey.diffieHellman

	const type: AccountTypeT = makeAccountTypeHD({
		hdPath,
		hdAccountType: HDAccountTypeIdentifier.LOCAL,
	})

	const newAccount = {
		...type, // forward sugar for boolean account type getters
		isLocalHDAccount: type.isHDAccount && !type.isHardwareAccount,
		decrypt: makeDecrypt(diffieHellman),
		encrypt: makeEncrypt(diffieHellman),
		sign: sign,
		hdPath,
		publicKey,
		type,
		uniqueIdentifier: type.uniqueKey,
		toString: (): string => {
			throw new Error('Overriden below')
		},
		equals: (other: AccountT): boolean => {
			return publicKey.equals(other.publicKey)
		},
	}

	return {
		...newAccount,
		toString: () => stringifyAccount(newAccount),
	}
}

const fromHDPathWithHardwareWallet = (
	input: Readonly<{
		hdPath: HDPathRadixT
		onHardwareWalletConnect: Observable<HardwareWalletSimpleT>
	}>,
): Observable<AccountT> => {
	const { hdPath, onHardwareWalletConnect: hardwareWallet$ } = input

	type Tmp = {
		hardwareWalletSimple: HardwareWalletSimpleT
		publicKey: PublicKey
	}

	const type: AccountTypeT = makeAccountTypeHD({
		hdPath,
		hdAccountType: HDAccountTypeIdentifier.HARDWARE_OR_REMOTE,
	})

	return hardwareWallet$.pipe(
		mergeMap(
			(hw: HardwareWalletSimpleT): Observable<Tmp> => {
				return hw.derivePublicKey(hdPath).pipe(
					map(
						(publicKey: PublicKey): Tmp => ({
							publicKey,
							hardwareWalletSimple: hw,
						}),
					),
				)
			},
		),
		map(
			({ publicKey, hardwareWalletSimple }): AccountT => {
				const newAccount: AccountT = {
					...type, // forward sugar for boolean account type getters
					isLocalHDAccount: false, // hardware is not local
					publicKey,
					hdPath,
					sign: (hashedMessage: Buffer): Observable<Signature> => {
						return hardwareWalletSimple.sign({
							hashedMessage,
							hdPath,
						})
					},
					decrypt: makeDecryptHW(hardwareWalletSimple, hdPath),
					encrypt: makeEncryptHW(hardwareWalletSimple, hdPath),
					type,
					uniqueIdentifier: type.uniqueKey,
					toString: (): string => {
						throw new Error('Overridden below.')
					},
					equals: (other: AccountT): boolean => {
						return publicKey.equals(other.publicKey)
					},
				}

				return {
					...newAccount,
					toString: (): string => stringifyAccount(newAccount),
				}
			},
		),
	)
}

const byDerivingNodeAtPath = (
	input: Readonly<{
		hdPath: HDPathRadixT
		deriveNodeAtPath: () => HDNodeT
	}>,
): AccountT =>
	fromPrivateKeyAtHDPath({
		...input,
		privateKey: input.deriveNodeAtPath().privateKey,
	})

const fromHDPathWithHDMasterNode = (
	input: Readonly<{
		hdPath: HDPathRadixT
		hdMasterNode: HDNodeT
	}>,
): AccountT => {
	const hdNodeAtPath = input.hdMasterNode.derive(input.hdPath)
	return fromPrivateKeyAtHDPath({
		...input,
		privateKey: hdNodeAtPath.privateKey,
	})
}

const fromHDPathWithHDMasterSeed = (
	input: Readonly<{
		hdPath: HDPathRadixT
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
		inspection.publicKey !== undefined &&
		isPublicKey(inspection.publicKey) &&
		inspection.sign !== undefined &&
		inspection.encrypt !== undefined &&
		inspection.decrypt !== undefined &&
		inspection.type !== undefined
	)
}

export const Account = {
	__unsafeFromPrivateKeyAtHDPath: fromPrivateKeyAtHDPath,
	byDerivingNodeAtPath,
	fromHDPathWithHardwareWallet,
	fromHDPathWithHDMasterNode,
	fromHDPathWithHDMasterSeed,
}
