import { Granularity, randomNonce } from '@radixdlt/primitives'
import { tokenPermissionsAll } from './tokenPermissions'
import {
	ResourceIdentifier,
	Supply,
	TokenPermissions,
	UnallocatedTokensParticle,
} from './_types'

export type UnallocatedTokensParticleInput = Readonly<{
	tokenDefinitionReference: ResourceIdentifier
	granularity: Granularity
	amount: Supply
	permissions?: TokenPermissions
}>

export const unallocatedTokensParticle = (
	input: UnallocatedTokensParticleInput,
): UnallocatedTokensParticle => ({
	particleType: 'UnallocatedTokensParticle',
	tokenDefinitionReference: input.tokenDefinitionReference,
	granularity: input.granularity,
	nonce: randomNonce(),
	amount: input.amount,
	permissions: input.permissions ?? tokenPermissionsAll,
})
