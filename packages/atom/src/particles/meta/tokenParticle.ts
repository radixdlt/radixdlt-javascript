import { DSONKeyValue } from '@radixdlt/data-formats'
import { Amount, Granularity, Nonce, randomNonce } from '@radixdlt/primitives'
import { pipe } from '@radixdlt/util'
import { tokenPermissionsAll } from '../../tokenPermissions'
import { ResourceIdentifier, TokenPermissions } from '../../_types'
import { TokenParticle } from '../_types'
import { withParticleEquals } from './particle'

export type TokenParticleInput = Readonly<{
	granularity: Granularity
	amount: Amount
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

const withAmount = (
	input: TokenParticleInput,
): TokenParticleInput & { amount: Amount } => ({
	...input,
	amount: input.amount,
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
	{
		key: 'amount',
		value: input.amount,
	},
]

export const withTokenParticleEquals = withParticleEquals.bind(
	null,
	(p1: TokenParticle, p2: TokenParticle) =>
		p1.tokenDefinitionReference.equals(p2.tokenDefinitionReference) &&
		p1.amount.equals(p2.amount) &&
		p1.granularity.equals(p2.granularity) &&
		p1.permissions.equals(p2.permissions),
)

export const tokenParticleProps = (input: TokenParticleInput): TokenParticle =>
	// eslint-disable-next-line  @typescript-eslint/no-unsafe-return
	pipe(withNonce, withAmount, withPermissions)(input)
