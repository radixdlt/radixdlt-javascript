import {
	Address,
	addressFromBase58String,
	addressFromUnsafe,
} from '@radixdlt/account'
import { Signature } from '@radixdlt/crypto'
import { ResourceIdentifier, TokenPermissions } from '../../src/_types'
import {
	Amount,
	amountFromUnsafe,
	AmountInputUnsafe,
	Granularity,
} from '@radixdlt/primitives'
import { combine, Result } from 'neverthrow'
import { resourceIdentifierFromUnsafe } from '../../src/resourceIdentifier'
import {
	transferrableTokensParticle,
	TransferrableTokensParticleInput,
} from '../../src/particles/transferrableTokensParticle'

import { unallocatedTokensParticle } from '../../src/particles/unallocatedTokensParticle'
import { UInt256 } from '@radixdlt/uint256'
import {
	TransferrableTokensParticle,
	UnallocatedTokensParticle,
} from '../../src/particles/_types'
import { TokenParticleInput } from '../../src/particles/meta/tokenParticle'

export const transferrableTokensParticleFromUnsafe = (
	input: Readonly<{
		address: Address | string
		resourceIdentifier: ResourceIdentifier | string
		granularity: Granularity | AmountInputUnsafe
		amount: Amount | AmountInputUnsafe
		permissions?: TokenPermissions
	}>,
): Result<TransferrableTokensParticle, Error> => {
	const address = addressFromUnsafe(input.address)
	const resourceIdentifier = resourceIdentifierFromUnsafe(
		input.resourceIdentifier,
	)
	const granularity = amountFromUnsafe(input.granularity)
	const amount = amountFromUnsafe(input.amount)

	return combine([address, resourceIdentifier, granularity, amount])
		.map(
			(resultList) =>
				<TransferrableTokensParticleInput>{
					address: resultList[0],
					resourceIdentifier: resultList[1],
					granularity: resultList[2],
					amount: resultList[3],
					permissions: input.permissions,
				},
		)
		.andThen(transferrableTokensParticle)
}

export const unallocatedTokensParticleFromUnsafe = (
	input: Readonly<{
		resourceIdentifier: ResourceIdentifier | string
		granularity: Granularity | AmountInputUnsafe
		amount: Amount | AmountInputUnsafe
		permissions?: TokenPermissions
	}>,
): Result<UnallocatedTokensParticle, Error> => {
	const resourceIdentifier = resourceIdentifierFromUnsafe(
		input.resourceIdentifier,
	)
	const granularity = amountFromUnsafe(input.granularity)
	const amount = amountFromUnsafe(input.amount)

	return combine([resourceIdentifier, granularity, amount])
		.map(
			(resultList) =>
				<TokenParticleInput>{
					resourceIdentifier: resultList[0],
					granularity: resultList[1],
					amount: resultList[2],
					permissions: input.permissions,
				},
		)
		.map(unallocatedTokensParticle)
}

// TODO CODE DUPLICATION! Move to shared testing only package.
export const signatureFromHexStrings = (input: {
	r: string
	s: string
}): Signature => {
	const r = new UInt256(input.r, 16)
	const s = new UInt256(input.s, 16)
	return {
		r,
		s,
		equals: (other: Signature): boolean => r.eq(other.r) && s.eq(other.s),
	}
}

// TODO CODE DUPLICATION remove to separate test package...
export const toAddress = (b58: string): Address =>
	addressFromBase58String(b58)._unsafeUnwrap()
