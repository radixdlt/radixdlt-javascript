import {
	resultToAsync,
	secureRandomUInt256,
	uint256Max,
} from '@radixdlt/primitives'

import { UInt256 } from '@radixdlt/uint256'

import { signDataWithPrivateKey } from './wrap/sign'

import { Result, ResultAsync } from 'neverthrow'
import {
	UnsignedMessage,
	Signature,
	PublicKey,
	PrivateKey,
	KeyPair,
} from './_types'
import { publicKeyFromPrivateKey } from './wrap/publicKeyWrapped'
import { SecureRandom, secureRandomGenerator } from '@radixdlt/util'
import { Secp256k1 } from './secp256k1'

export const privateKeyFromScalar = (scalar: UInt256): PrivateKey => {
	return {
		sign: (
			unsignedMessage: UnsignedMessage,
		): ResultAsync<Signature, Error> =>
			resultToAsync(
				signDataWithPrivateKey({
					privateKey: scalar,
					data: unsignedMessage.hasher(unsignedMessage.unhashed),
				}),
			),

		derivePublicKey: (): ResultAsync<PublicKey, Error> =>
			resultToAsync(
				publicKeyFromPrivateKey({
					privateKey: scalar,
				}),
			),

		toString: (): string => {
			return scalar.toString(16)
		},
		scalar: scalar,
	}
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
	return privateKeyFromScalar(scalar)
}
