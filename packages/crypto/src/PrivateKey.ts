import { resultToAsync } from '@radixdlt/primitives'

import { UInt256 } from '@radixdlt/uint256'

import { signDataWithPrivateKey } from './wrap/sign'

import { ResultAsync } from 'neverthrow'
import { UnsignedMessage, Signature, Signer } from './_types'

export const PrivateKey = (scalar: UInt256): Signer => {
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
	}
}
