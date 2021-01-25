import { Granularity } from '@radixdlt/primitives'
import { particle, ParticleInput } from './particle'
import { Supply, TokenParticle, TokenPermissions } from './_types'

export type TokenParticleInput = ParticleInput &
	Readonly<{
		granularity: Granularity
		amount: Supply
		permissions?: TokenPermissions
	}>

export const tokenParticle = (input: TokenParticleInput) =>
	particle<TokenParticle>({
		...input,
		equals: (other: TokenParticle) =>
			other.granularity === input.granularity &&
			other.amount === input.amount &&
			other.permissions === input.permissions,
	})
