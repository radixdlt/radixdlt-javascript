// Internal packages
// Modules in other internal packages
import { UInt256, uint256FromBN } from '@radixdlt/subatomic'

// Internal modules
import { UnsignedMessage } from './UnsignedMessage'
import { Signature } from './Signature'

// External packages
import { ec } from 'elliptic'

export type Signer = {
	/**
	 * Produces a cryptographic signature of the input.
	 *
	 * @param {UnsignedMessage} unsignedMessage - The unsigned message to be hashed and signed.
	 * @returns {Signature} An EC signature produces by this signer when signing the message.
	 */
	readonly sign: (input: {
		readonly unsignedMessage: UnsignedMessage
	}) => Promise<Signature>
}

const signatureFromIndutnyEllipticSignature = (input: {
	readonly signature: ec.Signature
}): Signature => {
	const ellipticSignature = input.signature

	/* eslint-disable @typescript-eslint/no-unsafe-assignment */
	return {
		r: uint256FromBN({ bn: ellipticSignature.r }),
		s: uint256FromBN({ bn: ellipticSignature.s }),
	}
	/* eslint-enable @typescript-eslint/no-unsafe-assignment */
}

const signWithIndutnyElliptic = (input: {
	readonly privateKey: UInt256
	readonly data: Buffer
}): Signature => {
	const secp256k1 = new ec('secp256k1')

	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
	const privateKey = secp256k1.keyFromPrivate(input.privateKey.toString(16))

	const ellipticSignature = privateKey.sign(input.data, {
		canonical: true,
	})

	return signatureFromIndutnyEllipticSignature({
		signature: ellipticSignature,
	})
}

// eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
export const PrivateKey = (input: { readonly scalar: UInt256 }): Signer => {
	return {
		sign: (input_: {
			readonly unsignedMessage: UnsignedMessage
		}): Promise<Signature> => {
			return Promise.resolve(
				signWithIndutnyElliptic({
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					privateKey: input.scalar,
					data: input_.unsignedMessage.hasher(
						input_.unsignedMessage.unhashed,
					),
				}),
			)
		},
	}
}
