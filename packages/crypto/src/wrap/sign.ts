import { uint256FromBN } from '@radixdlt/primitives'

import { UInt256 } from '@radixdlt/uint256'

import { combine, Result } from 'neverthrow'
import { ec } from 'elliptic'
import { Signature } from '../_types'

export const signDataWithPrivateKey = (
	input: Readonly<{
		privateKey: UInt256
		data: Buffer
	}>,
): Result<Signature, Error> => {
	const secp256k1 = new ec('secp256k1')

	const privateKey = secp256k1.keyFromPrivate(input.privateKey.toString(16))

	const ellipticSignature = privateKey.sign(input.data, {
		canonical: true,
	})

	return combine([
		uint256FromBN(ellipticSignature.r),
		uint256FromBN(ellipticSignature.s),
	]).map((resultList) => ({
		r: resultList[0],
		s: resultList[1],
	}))
}
