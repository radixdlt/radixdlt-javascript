import { SignatureT } from './_types'
import { combine, err, Result } from 'neverthrow'
import { UInt256 } from '@radixdlt/uint256'
import { ec } from 'elliptic'
import { uint256FromBN } from '@radixdlt/primitives'
import { importDER } from './typings/importDER'

const __fromRSAndDER = (
	input: Readonly<{
		r: UInt256
		s: UInt256
		der: string
	}>,
): SignatureT => {
	const { r, s, der } = input
	return {
		r,
		s,
		toDER: () => der,
		equals: (other: SignatureT): boolean => r.eq(other.r) && s.eq(other.s),
	}
}

const fromIndutnyElliptic = (
	ellipticSignature: ec.Signature,
): Result<SignatureT, Error> => {
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
		return __fromRSAndDER({ r, s, der })
	})
}

const fromDER = (buffer: Buffer): Result<SignatureT, Error> => {
	const importedDER = importDER(buffer, 'hex')
	if (!importedDER) {
		return err(new Error('Failed to import DER'))
	}
	const sig: ec.Signature = <ec.Signature>{}
	sig.r = importedDER.r
	sig.s = importedDER.s
	sig.recoveryParam = null
	return fromIndutnyElliptic(sig)
}

export const Signature = {
	fromDER,
	fromIndutnyElliptic,
}
