import { resultToAsync } from '@radixdlt/primitives'

import { UInt256 } from '@radixdlt/uint256'

import { signDataWithPrivateKey } from './wrap/sign'

import { errAsync, ResultAsync } from 'neverthrow'
import {
	UnsignedMessage,
	Signature,
	PublicKey,
	PrivateKey,
	PublicKeyDerivation,
	NoDerivationInputNeeded,
} from './_types'
import { publicKeyFromPrivateKey } from './wrap/publicKeyFromPrivateKey'

const noDerivation: NoDerivationInputNeeded = {
	derivationMethod: 'none',
}

export const privateKeyFromScalar = (scalar: UInt256): PrivateKey => {
	return {
		sign: (
			unsignedMessage: UnsignedMessage,
		): ResultAsync<Signature, Error> => (
			resultToAsync(
				signDataWithPrivateKey({
					privateKey: scalar,
					data: unsignedMessage.hasher(unsignedMessage.unhashed),
				}),
			)
		),

		derivePublicKey: (
			publicKeyDerivation?: PublicKeyDerivation,
		): ResultAsync<PublicKey, Error> => {
			const derivation = publicKeyDerivation ?? noDerivation
			if (derivation.derivationMethod === 'none') {
				return resultToAsync(
					publicKeyFromPrivateKey({
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
