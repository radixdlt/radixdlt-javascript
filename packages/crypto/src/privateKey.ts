import { resultToAsync } from '@radixdlt/primitives'

import { UInt256 } from '@radixdlt/uint256'

import { signDataWithPrivateKey } from './wrap/sign'

import { ResultAsync } from 'neverthrow'
import { UnsignedMessage, Signature, PublicKey, PrivateKey } from './_types'
import { publicKeyFromPrivateKey } from './wrap/publicKeyFromPrivateKey'

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
	}
}
