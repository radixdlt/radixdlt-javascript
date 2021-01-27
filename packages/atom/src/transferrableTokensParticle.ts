import { PositiveAmount, randomNonce } from '@radixdlt/primitives'

import { Address } from '@radixdlt/crypto'
import { ParticleBase, TransferrableTokensParticle } from './_types'

import { err, ok, Result } from 'neverthrow'
import { tokenPermissionsAll } from './tokenPermissions'
import {
	RadixParticleType,
	TransferrableTokensParticleType,
} from './radixParticleTypes'
import { DSONEncoding, DSONKeyValue } from '@radixdlt/dson'
import {
	encodableKeyValuesFromTokenParticleBase,
	isTokenParticleBase,
	tokenParticleBaseEquals,
	TokensParticleBaseInput,
} from './tokenParticleBase'

export type TransferrableTokensParticleInput = TokensParticleBaseInput &
	Readonly<{
		amount: PositiveAmount
		address: Address
	}>

export const transferrableTokensParticle = (
	input: TransferrableTokensParticleInput,
): Result<TransferrableTokensParticle, Error> => {
	if (!input.amount.isMultipleOf(input.granularity)) {
		return err(new Error('Amount not multiple of granularity'))
	}

	const nonce = input.nonce ?? randomNonce()
	const address = input.address
	const tokenDefinitionReference = input.tokenDefinitionReference
	const granularity = input.granularity
	const amount = input.amount
	const permissions = input.permissions ?? tokenPermissionsAll

	const tokenParticleBase = {
		address,
		tokenDefinitionReference,
		granularity,
		nonce,
		amount,
		permissions,
	}

	const dsonKeyValues: DSONKeyValue[] = [
		...encodableKeyValuesFromTokenParticleBase(tokenParticleBase),
		{
			key: 'address',
			value: address,
		},
		{
			key: 'amount',
			value: amount,
		},
	]

	return ok({
		...DSONEncoding({
			serializer: 'radix.particles.transferrable_tokens',
			encodingMethodOrKeyValues: dsonKeyValues,
		}),
		radixParticleType: TransferrableTokensParticleType,
		...tokenParticleBase,
		// eslint-disable-next-line complexity
		equals: (otherParticle: ParticleBase): boolean => {
			if (!isTransferrableTokensParticle(otherParticle)) return false
			const otherTTP = otherParticle

			return (
				tokenParticleBaseEquals(tokenParticleBase, otherParticle) &&
				otherTTP.address.equals(address) &&
				otherTTP.amount.equals(amount)
			)
		},
	})
}

// eslint-disable-next-line complexity
export const isTransferrableTokensParticle = (
	something: unknown,
): something is TransferrableTokensParticle => {
	if (!isTokenParticleBase(something)) return false
	const inspection = something as TransferrableTokensParticle
	return (
		inspection.radixParticleType ===
			RadixParticleType.TRANSFERRABLE_TOKENS &&
		inspection.address !== undefined &&
		inspection.amount !== undefined &&
		inspection.equals !== undefined
	)
}
