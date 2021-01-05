import { UInt256, uint256FromBN, resultToAsync } from '@radixdlt/primitives'

import { UnsignedMessage } from './UnsignedMessage'
import { Signature } from './Signature'

import { ec } from 'elliptic'
import { combine, Result, ResultAsync } from 'neverthrow'

export type Signer = {
	/**
	 * Produces a cryptographic signature of the input.
	 *
	 * @param {UnsignedMessage} unsignedMessage - The unsigned message to be hashed and signed.
	 * @returns {Signature} An EC signature produces by this signer when signing the message.
	 */
	readonly sign: (
		unsignedMessage: UnsignedMessage,
	) => ResultAsync<Signature, Error>
}

const signWithIndutnyElliptic = (input: {
	readonly privateKey: UInt256
	readonly data: Buffer
}): Result<Signature, Error> => {
	const secp256k1 = new ec('secp256k1')

	const privateKey = secp256k1.keyFromPrivate(input.privateKey.toString(16))

	const ellipticSignature = privateKey.sign(input.data, {
		canonical: true,
	})

	return combine([
		uint256FromBN(ellipticSignature.r),
		uint256FromBN(ellipticSignature.s),
	]).map((resultList) => {
		const signature: Signature = {
			r: resultList[0],
			s: resultList[1],
		}
		return signature
	})
}

export const PrivateKey = (scalar: UInt256): Signer => {
	return {
		sign: (
			unsignedMessage: UnsignedMessage,
		): ResultAsync<Signature, Error> => {
			return resultToAsync(
				signWithIndutnyElliptic({
					privateKey: scalar,
					data: unsignedMessage.hasher(unsignedMessage.unhashed),
				}),
			)
		},
	}
}
