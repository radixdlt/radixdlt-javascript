import { DSONKeyValue } from '@radixdlt/dson'
import { Granularity, Nonce, randomNonce } from '@radixdlt/primitives'
import { pipe } from '@radixdlt/util'
import { tokenPermissionsAll } from '../../tokenPermissions'
import { ResourceIdentifier, TokenPermissions } from '../../_types'
import { TokenParticle } from '../_types'
import { withParticleEquals } from './particle'
import { ParticleInput } from './_types'

export type TokenParticleInput = ParticleInput &
	Readonly<{
		granularity: Granularity
		permissions?: TokenPermissions
		tokenDefinitionReference: ResourceIdentifier
		nonce?: Nonce
	}>

const withNonce = (
	input: TokenParticleInput,
): TokenParticleInput & { nonce: Nonce } => ({
	...input,
	nonce: input.nonce ?? randomNonce(),
})

const withPermissions = (
	input: TokenParticleInput,
): TokenParticleInput & { permissions: TokenPermissions } => ({
	...input,
	permissions: input.permissions ?? tokenPermissionsAll,
})

export const tokenDSONKeyValues = (input: TokenParticle): DSONKeyValue[] => [
	{
		key: 'tokenDefinitionReference',
		value: input.tokenDefinitionReference,
	},
	{
		key: 'granularity',
		value: input.granularity,
	},
	{
		key: 'permissions',
		value: input.permissions,
	},
	{
		key: 'nonce',
		value: input.nonce,
	},
]

export const withTokenParticleEquals = withParticleEquals.bind(
	null,
	(p1: TokenParticle, p2: TokenParticle) =>
		p1.tokenDefinitionReference.equals(p2.tokenDefinitionReference) &&
		p1.granularity.equals(p2.granularity) &&
		p1.permissions.equals(p2.permissions),
)

export const tokenParticleProps = (input: TokenParticleInput): TokenParticle =>
	// eslint-disable-next-line
	pipe(withNonce, withPermissions)(input)
