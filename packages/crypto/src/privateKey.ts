import {
	resultToAsync,
	secureRandomUInt256,
	uint256Max,
} from '@radixdlt/primitives'

import { UInt256 } from '@radixdlt/uint256'

import { signDataWithPrivateKey } from './wrap/sign'

import { err, ok, Result, ResultAsync } from 'neverthrow'
import {
	UnsignedMessage,
	Signature,
	PublicKey,
	PrivateKey,
	UnsignedUnhashedMessage,
} from './_types'
import { publicKeyFromPrivateKey } from './wrap/publicKeyWrapped'
import { SecureRandom, secureRandomGenerator } from '@radixdlt/util'
import { Secp256k1 } from './secp256k1'

const privateKeyFromValidatedScalar = (scalar: UInt256): PrivateKey => {
	const signHashed = (
		unsignedMessage: UnsignedMessage,
	): ResultAsync<Signature, Error> =>
		resultToAsync(
			signDataWithPrivateKey({
				privateKey: scalar,
				data: unsignedMessage.hashedMessage,
			}),
		)

	const privateKey = {
		signHashed,

		signUnhashed: (
			unsignedMessage: UnsignedUnhashedMessage,
		): ResultAsync<Signature, Error> =>
			signHashed({
				hashedMessage: unsignedMessage.hasher(unsignedMessage.unhashed),
			}),

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
