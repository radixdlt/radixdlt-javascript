import { UInt256 } from '@radixdlt/uint256'

import { err, ok, Result } from 'neverthrow'
import { ec } from 'elliptic'
import BN from 'bn.js'
import { PublicKey, Signature, UnsignedMessage } from '../_types'

const bnFromUint256 = (uint256: UInt256): BN => {
	return new BN(uint256.toString(16), 'hex')
}

export const getPublicKey = (input: {
	readonly privateKey: UInt256
}): Result<PublicKey, Error> => {
	const secp256k1 = new ec('secp256k1')

	const privateKey = secp256k1.keyFromPrivate(input.privateKey.toString(16))

	const validation = privateKey.validate()

	if (!validation.result) {
		return err(new Error(`Invalid privateKey: ${validation.reason}`))
	}

	const publicKey: PublicKey = {
		asData: (input_: { readonly compressed: boolean }): Buffer => {
			return Buffer.from(privateKey.getPublic(input_.compressed, 'array'))
		},
		isValidSignature: (input_: {
			readonly signature: Signature
			readonly forData: UnsignedMessage
		}): boolean => {
			const unsignedMessage = input_.forData
			const message = unsignedMessage.hasher(unsignedMessage.unhashed)
			const signature = input_.signature
			const r = bnFromUint256(signature.r)
			const s = bnFromUint256(signature.s)
			return privateKey.verify(new BN(message), { r, s })
		},
	}

	return ok(publicKey)
}
