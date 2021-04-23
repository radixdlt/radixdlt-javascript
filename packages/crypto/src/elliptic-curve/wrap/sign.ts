import { uint256FromBN } from '@radixdlt/primitives'

import { UInt256 } from '@radixdlt/uint256'

import { combine, Result } from 'neverthrow'
import { ec } from 'elliptic'
import { Signature } from '../../_types'

export const signDataWithPrivateKey = (
	input: Readonly<{
		privateKey: UInt256
		data: Buffer
	}>,
): Result<Signature, Error> => {
	// log.info(`Signing ${input.data.toString()} with private key.`)
	const thirdPartyLibEllipticSecp256k1 = new ec('secp256k1')

	const privateKey = thirdPartyLibEllipticSecp256k1.keyFromPrivate(
		input.privateKey.toString(16),
	)

	const ellipticSignature: ec.Signature = privateKey.sign(input.data, {
		canonical: true,
	})

	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
	const derUnknown = ellipticSignature.toDER('hex')
	if (!derUnknown || typeof derUnknown !== 'string') {
		throw new Error(
			'Incorrect implementation, should always be able to format DER from signature.',
		)
	}
	const der: string = derUnknown

	return combine([
		uint256FromBN(ellipticSignature.r),
		uint256FromBN(ellipticSignature.s),
	]).map((resultList) => {
		const r = resultList[0]
		const s = resultList[1]
		// log.info('Signed successfully.')
		return {
			r,
			s,
			toDER: () => der,
			equals: (other: Signature): boolean =>
				r.eq(other.r) && s.eq(other.s),
		}
	})
}
