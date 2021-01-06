import BN from 'bn.js'
import { err, Result, ok } from 'neverthrow'
import { UInt256 } from '@radixdlt/uint256'

const bnUInt256Max: BN = new BN(2).pow(new BN(256)).sub(new BN(1))

export const fitsInUInt256 = (number: BN | number): boolean => {
	const bn = new BN(number)
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
export const uint256FromBN = (bn: BN): Result<UInt256, Error> => {
	if (!fitsInUInt256(bn)) {
		return err(
			new Error(
				`BN is either less than 0 or larger than 2^256 - 1, which does not fit in a UInt256.`,
			),
		)
	}
	return ok(new UInt256(bn.toString('hex'), 16))
}
