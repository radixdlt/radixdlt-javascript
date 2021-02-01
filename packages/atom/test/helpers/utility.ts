import {
	Address,
	addressFromBase58String,
	addressFromUnsafe,
	Signature,
} from '@radixdlt/crypto'
import { ResourceIdentifier, Supply, TokenPermissions } from '../../src/_types'
import {
	amountFromUnsafe,
	AmountInputUnsafe,
	Granularity,
	positiveAmount,
	PositiveAmount,
} from '@radixdlt/primitives'
import { combine, Result } from 'neverthrow'
import { resourceIdentifierFromUnsafe } from '../../src/resourceIdentifier'
import {
	transferrableTokensParticle,
	TransferrableTokensParticleInput,
} from '../../src/particles/transferrableTokensParticle'

import {
	unallocatedTokensParticle,
	UnallocatedTokensParticleInput,
} from '../../src/particles/unallocatedTokensParticle'
import { UInt256 } from '@radixdlt/uint256'
import {
	TransferrableTokensParticle,
	UnallocatedTokensParticle,
} from '../../src/particles/_types'

export const transferrableTokensParticleFromUnsafe = (
	input: Readonly<{
		address: Address | string
		tokenDefinitionReference: ResourceIdentifier | string
		granularity: Granularity | AmountInputUnsafe
		amount: PositiveAmount | AmountInputUnsafe
		permissions?: TokenPermissions
	}>,
): Result<TransferrableTokensParticle, Error> => {
	const address = addressFromUnsafe(input.address)
	const tokenDefinitionReference = resourceIdentifierFromUnsafe(
		input.tokenDefinitionReference,
	)
	const granularity: Result<Granularity, Error> = amountFromUnsafe(
		input.granularity,
	)
	const amount: Result<PositiveAmount, Error> = amountFromUnsafe(
		input.amount,
	).andThen(positiveAmount)

	return combine([address, tokenDefinitionReference, granularity, amount])
		.map(
			(resultList) =>
				<TransferrableTokensParticleInput>{
					address: resultList[0],
					tokenDefinitionReference: resultList[1],
					granularity: resultList[2],
					amount: resultList[3],
					permissions: input.permissions,
				},
		)
		.andThen(transferrableTokensParticle)
}

export const unallocatedTokensParticleFromUnsafe = (
	input: Readonly<{
		tokenDefinitionReference: ResourceIdentifier | string
		granularity: Granularity | AmountInputUnsafe
		amount: Supply | AmountInputUnsafe
		permissions?: TokenPermissions
	}>,
): Result<UnallocatedTokensParticle, Error> => {
	const tokenDefinitionReference = resourceIdentifierFromUnsafe(
		input.tokenDefinitionReference,
	)
	const granularity: Result<Granularity, Error> = amountFromUnsafe(
		input.granularity,
	)
	const amount: Result<Supply, Error> = amountFromUnsafe(input.amount)

	return combine([tokenDefinitionReference, granularity, amount])
		.map(
			(resultList) =>
				<UnallocatedTokensParticleInput>{
					tokenDefinitionReference: resultList[0],
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
