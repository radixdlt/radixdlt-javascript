import {
	DiffieHellman,
	ECPointOnCurveT,
	EncryptedMessageT,
	isPublicKey,
	MessageEncryption,
	PrivateKeyT,
	PublicKeyT,
	SignatureT,
	HDPathRadixT,
	HDMasterSeedT,
	HDNodeT,
} from '@radixdlt/crypto'
import { map, mergeMap } from 'rxjs/operators'
import { Observable } from 'rxjs'
import { toObservable } from '@radixdlt/util'
import {
	SigningKeyDecryptionInput,
	SigningKeyEncryptionInput,
	SigningKeyT,
	SigningKeyTypeHDT,
	SigningKeyTypeIdentifier,
	SigningKeyTypeNonHDT,
	SigningKeyTypeT,
	HardwareSigningKeyT,
	HDSigningKeyTypeIdentifier,
	PrivateKeyToSigningKeyInput,
} from './_types'
import { okAsync, ResultAsync } from 'neverthrow'
import { Option } from 'prelude-ts'

const stringifySigningKey = (signingKey: SigningKeyT): string => {
	return `
		type: ${signingKey.type.typeIdentifier.toString()},
		publicKey: ${signingKey.publicKey.toString(true)},
		hdPath?: ${Option.of<HDPathRadixT>(signingKey.hdPath)
			.map((hdp) => hdp.toString())
			.getOrElse('NONE')},
		isHDSigningKey: ${signingKey.isHDSigningKey ? 'YES' : 'NO'},
		isHardwareSigningKey: ${signingKey.isHardwareSigningKey ? 'YES' : 'NO'},
	`
}

const makeSigningKeyTypeHD = (
	input: Readonly<{
		hdPath: HDPathRadixT
		hdSigningKeyType: HDSigningKeyTypeIdentifier
	}>,
): SigningKeyTypeHDT => {
	const { hdPath, hdSigningKeyType } = input
	const isHardwareSigningKey =
		hdSigningKeyType === HDSigningKeyTypeIdentifier.HARDWARE_OR_REMOTE
	const uniqueKey = `${
		isHardwareSigningKey ? 'Hardware' : 'Local'
	}_HD_signingKey_at_path_${hdPath.toString()}`
	return {
		typeIdentifier: SigningKeyTypeIdentifier.HD_SIGNING_KEY,
		hdSigningKeyType,
		hdPath,
		uniqueKey,
		isHDSigningKey: true,
		isHardwareSigningKey,
	}
}

const makeSigningKeyTypeNonHD = (
	input: Readonly<{
		publicKey: PublicKeyT
		name?: string
	}>,
): SigningKeyTypeNonHDT => {
	const named = Option.of(input.name)
		.map((n) => `named_${n}`)
		.getOrElse('')
	const uniqueKey = `Non_hd_${named}pubKey${input.publicKey.toString(true)}`
	return {
		typeIdentifier: SigningKeyTypeIdentifier.NON_HD_SIGNING_KEY,
		uniqueKey,
		isHDSigningKey: false,
		isHardwareSigningKey: false,
		name: input.name,
	}
}

type Decrypt = (input: SigningKeyDecryptionInput) => Observable<string>
type Encrypt = (
	input: SigningKeyEncryptionInput,
) => Observable<EncryptedMessageT>

const makeDecrypt = (diffieHellman: DiffieHellman): Decrypt => {
	return (input: SigningKeyDecryptionInput): Observable<string> => {
		return toObservable(
			MessageEncryption.decrypt({
				...input,
				diffieHellmanPoint: (): ResultAsync<ECPointOnCurveT, Error> => {
					return diffieHellman(input.publicKeyOfOtherParty)
				},
			}).map((buf: Buffer) => buf.toString('utf-8')),
		)
	}
}

const makeEncrypt = (diffieHellman: DiffieHellman): Encrypt => {
	return (input: SigningKeyEncryptionInput): Observable<EncryptedMessageT> => {
		return toObservable(
			MessageEncryption.encrypt({
				plaintext: input.plaintext,
				diffieHellmanPoint: (): ResultAsync<ECPointOnCurveT, Error> => {
					return diffieHellman(input.publicKeyOfOtherParty)
				},
			}),
		)
	}
}

const makeEncryptHW = (
	hardwareSigningKey: HardwareSigningKeyT,
	hdPath: HDPathRadixT,
): Encrypt => {
	return (input: SigningKeyEncryptionInput): Observable<EncryptedMessageT> => {
		return hardwareSigningKey
			.diffieHellman({
				hdPath,
				publicKeyOfOtherParty: input.publicKeyOfOtherParty,
			})
			.pipe(
				mergeMap((dhPoint: ECPointOnCurveT) =>
					toObservable(
						MessageEncryption.encrypt({
							plaintext: input.plaintext,
							diffieHellmanPoint: () => okAsync(dhPoint),
						}),
					),
				),
			)
	}
}

const makeDecryptHW = (
	hardwareSigningKey: HardwareSigningKeyT,
	hdPath: HDPathRadixT,
): Decrypt => {
	return (input: SigningKeyDecryptionInput): Observable<string> => {
		return hardwareSigningKey
			.diffieHellman({
				hdPath,
				publicKeyOfOtherParty: input.publicKeyOfOtherParty,
			})
			.pipe(
				mergeMap((dhPoint: ECPointOnCurveT) =>
					toObservable(
						MessageEncryption.decrypt({
							encryptedMessage: input.encryptedMessage,
							diffieHellmanPoint: (): ResultAsync<
								ECPointOnCurveT,
								Error
							> => {
								return okAsync(dhPoint)
							},
						}),
					),
				),
				map((b) => b.toString('utf8')),
			)
	}
}

const fromPrivateKeyNamedOrFromHDPath = (
	input: Readonly<{
		privateKey: PrivateKeyT
		pathOrName?: HDPathRadixT | string
	}>,
): SigningKeyT => {
	const { privateKey } = input
	const publicKey: PublicKeyT = privateKey.publicKey()
	const sign = (hashedMessage: Buffer): Observable<SignatureT> =>
		toObservable(privateKey.sign(hashedMessage))

	const diffieHellman = privateKey.diffieHellman

	const type: SigningKeyTypeT =
		input.pathOrName === undefined || typeof input.pathOrName === 'string'
			? makeSigningKeyTypeNonHD({
					publicKey,
					name: input.pathOrName,
			  })
			: makeSigningKeyTypeHD({
					hdPath: input.pathOrName,
					hdSigningKeyType: HDSigningKeyTypeIdentifier.LOCAL,
			  })

	const newSigningKey = {
		...type, // forward sugar for boolean signingKey type getters
		isLocalHDSigningKey: type.isHDSigningKey && !type.isHardwareSigningKey,
		decrypt: makeDecrypt(diffieHellman),
		encrypt: makeEncrypt(diffieHellman),
		sign: sign,
		hdPath:
			input.pathOrName === undefined ||
			typeof input.pathOrName === 'string'
				? undefined
				: input.pathOrName,
		publicKey,
		type,
		uniqueIdentifier: type.uniqueKey,
		toString: (): string => {
			throw new Error('Overriden below')
		},
		equals: (other: SigningKeyT): boolean => {
			return publicKey.equals(other.publicKey)
		},
		__diffieHellman: diffieHellman,
	}

	return {
		...newSigningKey,
		toString: () => stringifySigningKey(newSigningKey),
	}
}

const fromPrivateKeyAtHDPath = (
	input: Readonly<{
		privateKey: PrivateKeyT
		hdPath: HDPathRadixT
	}>,
): SigningKeyT =>
	fromPrivateKeyNamedOrFromHDPath({
		...input,
		pathOrName: input.hdPath,
	})

const fromPrivateKey = (input: PrivateKeyToSigningKeyInput): SigningKeyT =>
	fromPrivateKeyNamedOrFromHDPath({
		...input,
		pathOrName: input.name,
	})

const fromHDPathWithHardwareWallet = (
	input: Readonly<{
		hdPath: HDPathRadixT
		hardwareWalletConnection: Observable<HardwareSigningKeyT>
	}>,
): Observable<SigningKeyT> => {
	const { hdPath, hardwareWalletConnection: hardwareWallet$ } = input

	type Tmp = {
		hardwareSigningKey: HardwareSigningKeyT
		publicKey: PublicKeyT
	}

	const type: SigningKeyTypeT = makeSigningKeyTypeHD({
		hdPath,
		hdSigningKeyType: HDSigningKeyTypeIdentifier.HARDWARE_OR_REMOTE,
	})

	return hardwareWallet$.pipe(
		mergeMap(
			(hw: HardwareSigningKeyT): Observable<Tmp> => {
				return hw.derivePublicKey(hdPath).pipe(
					map(
						(publicKey: PublicKeyT): Tmp => {
							return {
								publicKey,
								hardwareSigningKey: hw,
							}
						},
					),
				)
			},
		),
		map(
			({ publicKey, hardwareSigningKey }): SigningKeyT => {
				const newSigningKey: SigningKeyT = {
					...type, // forward sugar for boolean signingKey type getters
					isLocalHDSigningKey: false, // hardware is not local
					publicKey,
					hdPath,
					sign: (hashedMessage: Buffer): Observable<SignatureT> => {
						return hardwareSigningKey.sign({
							hashedMessage,
							hdPath,
						})
					},
					decrypt: makeDecryptHW(hardwareSigningKey, hdPath),
					encrypt: makeEncryptHW(hardwareSigningKey, hdPath),
					type,
					uniqueIdentifier: type.uniqueKey,
					toString: (): string => {
						throw new Error('Overridden below.')
					},
					equals: (other: SigningKeyT): boolean => {
						return publicKey.equals(other.publicKey)
					},
					__diffieHellman: (
						_publicKeyOfOtherParty: PublicKeyT,
					): ResultAsync<ECPointOnCurveT, Error> => {
						throw new Error('No Dh here, only used for testing.')
					},
				}

				return {
					...newSigningKey,
					toString: (): string => stringifySigningKey(newSigningKey),
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
): SigningKeyT =>
	fromPrivateKeyAtHDPath({
		...input,
		privateKey: input.deriveNodeAtPath().privateKey,
	})

const fromHDPathWithHDMasterNode = (
	input: Readonly<{
		hdPath: HDPathRadixT
		hdMasterNode: HDNodeT
	}>,
): SigningKeyT => {
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
): SigningKeyT => {
	const hdMasterNode = input.hdMasterSeed.masterNode()
	return fromHDPathWithHDMasterNode({ ...input, hdMasterNode })
}

export const isSigningKey = (something: unknown): something is SigningKeyT => {
	const inspection = something as SigningKeyT
	return (
		inspection.publicKey !== undefined &&
		isPublicKey(inspection.publicKey) &&
		inspection.sign !== undefined &&
		inspection.encrypt !== undefined &&
		inspection.decrypt !== undefined &&
		inspection.type !== undefined
	)
}

export const SigningKey = {
	__unsafeFromPrivateKeyAtHDPath: fromPrivateKeyAtHDPath,
	fromPrivateKey,
	byDerivingNodeAtPath,
	fromHDPathWithHardwareWallet,
	fromHDPathWithHDMasterNode,
	fromHDPathWithHDMasterSeed,
}
