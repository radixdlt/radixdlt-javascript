import BN from 'bn.js'
import { UInt256 } from 'uint256'

const bnUInt256Max: BN = new BN(2).pow(new BN(256)).sub(new BN(1))

export const fitsInUInt256 = (input: {
	readonly number: BN | number
}): boolean => {
	const bn = new BN(input.number)
	const isNotTooBig = bn.lte(bnUInt256Max)
	const isNonNegative = bn.gte(new BN(0))
	return isNotTooBig && isNonNegative
}

/**
 * Converts a big number (BN) into a UInt256
 *
 * @param {BN} bn - A big number to be converted into a UInt256.
 * @returns {UInt256} A 256 bit wide unsigned integer.
 */
export const uint256FromBN = (bn: BN): UInt256 => {
	if (!fitsInUInt256({ number: bn })) {
		// eslint-disable-next-line functional/no-throw-statement
		throw new Error(
			`BN is either less than 0 or larger than 2^256 - 1, which does not fit in a UInt256.`,
		)
	}
	return new UInt256(bn.toString('hex'), 16)
}
