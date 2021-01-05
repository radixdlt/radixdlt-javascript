import { UInt256, uint256FromBN } from '@radixdlt/subatomic'

import { UnsignedMessage } from './UnsignedMessage'
import { Signature } from './Signature'

import { ec } from 'elliptic'

export type Signer = {
	/**
	 * Produces a cryptographic signature of the input.
	 *
	 * @param {UnsignedMessage} unsignedMessage - The unsigned message to be hashed and signed.
	 * @returns {Signature} An EC signature produces by this signer when signing the message.
	 */
	readonly sign: (unsignedMessage: UnsignedMessage) => Promise<Signature>
}

const signWithIndutnyElliptic = (input: {
	readonly privateKey: UInt256
	readonly data: Buffer
}): Signature => {
	const secp256k1 = new ec('secp256k1')

	const privateKey = secp256k1.keyFromPrivate(input.privateKey.toString(16))

	const ellipticSignature = privateKey.sign(input.data, {
		canonical: true,
	})

	return {
		r: uint256FromBN(ellipticSignature.r),
		s: uint256FromBN(ellipticSignature.s),
	}
}

export const PrivateKey = (scalar: UInt256): Signer => {
	return {
		sign: async (unsignedMessage: UnsignedMessage): Promise<Signature> => {
			return signWithIndutnyElliptic({
				privateKey: scalar,
				data: unsignedMessage.hasher(unsignedMessage.unhashed),
			})
		},
	}
}
