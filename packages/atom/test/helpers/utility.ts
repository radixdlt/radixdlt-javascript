import {
	Address,
	addressFromBase58String,
	addressFromUnsafe,
	AddressT,
	Signature,
} from '@radixdlt/crypto'
import { ResourceIdentifierT, TokenPermissions } from '../../src/_types'
import {
	AmountT,
	AmountInputUnsafe,
	Granularity,
	Amount,
} from '@radixdlt/primitives'
import { combine, Result } from 'neverthrow'
import {
	TransferrableTokensParticle,
	TransferrableTokensParticleInput,
} from '../../src/particles/transferrableTokensParticle'

import { unallocatedTokensParticle } from '../../src/particles/unallocatedTokensParticle'
import { UInt256 } from '@radixdlt/uint256'
import {
	TransferrableTokensParticleT,
	UnallocatedTokensParticleT,
} from '../../src/particles/_types'
import { TokenParticleInput } from '../../src/particles/meta/tokenParticle'
import { ResourceIdentifier } from '../../src/resourceIdentifier'

export const transferrableTokensParticleFromUnsafe = (
	input: Readonly<{
		address: AddressT | string
		resourceIdentifier: ResourceIdentifierT | string
		granularity: Granularity | AmountInputUnsafe
		amount: AmountT | AmountInputUnsafe
		permissions?: TokenPermissions
	}>,
): Result<TransferrableTokensParticleT, Error> => {
	const address = addressFromUnsafe(input.address)
	const resourceIdentifier = ResourceIdentifier.fromUnsafe(
		input.resourceIdentifier,
	)
	const granularity = Amount.fromUnsafe(input.granularity)
	const amount = Amount.fromUnsafe(input.amount)

	return combine([address, resourceIdentifier, granularity, amount])
		.map(
			(resultList) =>
				<TransferrableTokensParticleInput>{
					address: resultList[0],
					resourceIdentifier: resultList[1],
					granularity: resultList[2],
					amount: resultList[3],
					permissions: input.permissions
						? input.permissions.permissions
						: undefined,
				},
		)
		.andThen(TransferrableTokensParticle.create)
}

export const unallocatedTokensParticleFromUnsafe = (
	input: Readonly<{
		resourceIdentifier: ResourceIdentifierT | string
		granularity: Granularity | AmountInputUnsafe
		amount: AmountT | AmountInputUnsafe
		permissions?: TokenPermissions
	}>,
): Result<UnallocatedTokensParticleT, Error> => {
	const resourceIdentifier = ResourceIdentifier.fromUnsafe(
		input.resourceIdentifier,
	)
	const granularity = Amount.fromUnsafe(input.granularity)
	const amount = Amount.fromUnsafe(input.amount)

	return combine([resourceIdentifier, granularity, amount])
		.map(
			(resultList) =>
				<TokenParticleInput>{
					resourceIdentifier: resultList[0],
					granularity: resultList[1],
					amount: resultList[2],
					permissions: input.permissions
						? input.permissions.permissions
						: undefined,
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
export const toAddress = (b58: string): AddressT =>
	addressFromBase58String(b58)._unsafeUnwrap()
