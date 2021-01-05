import { resultToAsync } from '@radixdlt/primitives'

import { UInt256 } from '@radixdlt/uint256'

import { signDataWithPrivateKey } from './wrap/sign'

import { errAsync, ResultAsync } from 'neverthrow'
import {
	UnsignedMessage,
	Signature,
	Signer,
	PublicKey,
	PublicKeyProvider,
	PublicKeyDerivation,
	NoInputForDerivationSincePrivateKeyIsCurrentlyAccessible,
} from './_types'
import { getPublicKey } from './wrap/getPublicKey'

const noDerivation: NoInputForDerivationSincePrivateKeyIsCurrentlyAccessible = {
	derivationMethod: 'none',
}

export const PrivateKey = (scalar: UInt256): Signer & PublicKeyProvider => {
	return {
		sign: (
			unsignedMessage: UnsignedMessage,
		): ResultAsync<Signature, Error> => {
			return resultToAsync(
				signDataWithPrivateKey({
					privateKey: scalar,
					data: unsignedMessage.hasher(unsignedMessage.unhashed),
				}),
			)
		},

		derivePublicKey: (
			publicKeyDerivation?: PublicKeyDerivation,
		): ResultAsync<PublicKey, Error> => {
			const derivation = publicKeyDerivation ?? noDerivation
			if (derivation.derivationMethod === 'none') {
				return resultToAsync(
					getPublicKey({
						privateKey: scalar,
					}),
				)
			}
			return errAsync(
				new Error(
					`Unexpected publicKeyDerivation, expected 'none' but got: '${derivation.derivationMethod}'`,
				),
			)
		},
	}
}
