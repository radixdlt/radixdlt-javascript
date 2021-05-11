import { SignatureT } from './_types'
import { combine, err, ok, Result } from 'neverthrow'
import { UInt256 } from '@radixdlt/uint256'
import { ec } from 'elliptic'
import { uint256FromBN } from '@radixdlt/primitives'

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jsImportDER = require('./indutnyEllipticImportDER')

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
		equals: (other: SignatureT): boolean => other.toDER() === der,
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

const fromDER = (buffer: Buffer | string): Result<SignatureT, Error> => {
	const dataHex = typeof buffer === 'string' ? buffer : buffer.toString('hex')
	/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
	const importedDER = jsImportDER(dataHex, 'hex')
	if (!importedDER) {
		return err(new Error('Failed to import DER'))
	}
	return ok(
		__fromRSAndDER({
			r: importedDER.r,
			s: importedDER.s,
			der: buffer.toString('hex'),
		}),
	)
	/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
}

export const Signature = {
	fromDER,
	fromIndutnyElliptic,
}
