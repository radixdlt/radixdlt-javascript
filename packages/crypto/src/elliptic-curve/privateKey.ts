import {
	resultToAsync,
	secureRandomUInt256,
	uint256Max,
} from '@radixdlt/primitives'

import { UInt256 } from '@radixdlt/uint256'

import { signDataWithPrivateKey } from './wrap/sign'

import { err, errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'
import {
	Signature,
	PublicKey,
	PrivateKey,
	Hasher,
	ECPointOnCurve,
	DiffieHellman,
} from '../_types'
import { publicKeyFromPrivateKey } from './wrap/publicKeyWrapped'
import { SecureRandom, secureRandomGenerator } from '@radixdlt/util'
import { Secp256k1 } from './secp256k1'
import { sha256Twice } from '../hash/sha'

const privateKeyFromValidatedScalar = (scalar: UInt256): PrivateKey => {
	const sign = (hashedMessage: Buffer): ResultAsync<Signature, Error> => {
		if (hashedMessage.length !== 32) {
			return errAsync(
				new Error(
					'Incorrect length of message to sign, expected 32 bytes.',
				),
			)
		}
		return resultToAsync(
			signDataWithPrivateKey({
				privateKey: scalar,
				data: hashedMessage,
			}),
		)
	}

	const dh: DiffieHellman = {
		diffieHellman: (
			publicKeyOfOtherParty: PublicKey,
		): ResultAsync<ECPointOnCurve, Error> => {
			return okAsync(
				publicKeyOfOtherParty
					.decodeToPointOnCurve()
					.multiplyWithPrivateKey(privateKey),
			)
		},
	}

	const privateKey = {
		sign,
		diffieHellman: dh,
		signUnhashed: (
			input: Readonly<{
				msgToHash: Buffer | string
				hasher?: Hasher
			}>,
		): ResultAsync<Signature, Error> => {
			const hasher = input.hasher ?? sha256Twice

			const hashedMessage = hasher(input.msgToHash)

			return sign(hashedMessage)
		},

		publicKey: () => {
			throw new Error('Impl me')
		},
		toString: (): string => {
			return scalar.toString(16)
		},
		scalar: scalar,
	}

	return {
		...privateKey,
		publicKey: (): PublicKey => publicKeyFromPrivateKey({ privateKey }),
	}
}

export const privateKeyFromBuffer = (
	buffer: Buffer,
): Result<PrivateKey, Error> => privateKeyFromHex(buffer.toString('hex'))

export const privateKeyFromHex = (
	privateKeyHexString: string,
): Result<PrivateKey, Error> =>
	privateKeyFromScalar(new UInt256(privateKeyHexString, 16))

export const privateKeyFromScalar = (
	scalar: UInt256,
): Result<PrivateKey, Error> => {
	if (!validateSecp256k1PrivateKey(scalar))
		return err(new Error('Invalid private key scalar.'))

	return ok(privateKeyFromValidatedScalar(scalar))
}

const validateSecp256k1PrivateKey = (scalar: UInt256): boolean =>
	scalar.gte(UInt256.valueOf(1)) && scalar.lte(Secp256k1.order)

export const generatePrivateKey = (
	secureRandom: SecureRandom = secureRandomGenerator,
): PrivateKey => {
	// eslint-disable-next-line functional/no-let
	let scalar: UInt256 = uint256Max
	// eslint-disable-next-line functional/no-loop-statement
	while (!validateSecp256k1PrivateKey(scalar)) {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
		scalar = secureRandomUInt256(secureRandom)
	}
	return privateKeyFromValidatedScalar(scalar)
}
