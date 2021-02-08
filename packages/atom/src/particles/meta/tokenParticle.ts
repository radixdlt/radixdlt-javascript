import { DSONKeyValue } from '@radixdlt/data-formats'
import {
	Amount,
	Granularity,
	granularityDefault,
	Nonce,
	randomNonce,
} from '@radixdlt/primitives'
import { pipe } from '@radixdlt/util'
import { tokenPermissionsAll } from '../../tokenPermissions'
import { ResourceIdentifier, TokenPermissions } from '../../_types'
import { TokenParticle } from '../_types'
import { withParticleEquals } from './particle'

export type TokenParticleInput = Readonly<{
	amount: Amount
	resourceIdentifier: ResourceIdentifier
	granularity?: Granularity
	permissions?: TokenPermissions
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

const withGranularity = (
	input: TokenParticleInput,
): TokenParticleInput & { granularity: Granularity } => ({
	...input,
	granularity: input.granularity ?? granularityDefault,
})

export const tokenDSONKeyValues = (input: TokenParticle): DSONKeyValue[] => [
	{
		key: 'tokenDefinitionReference',
		value: input.resourceIdentifier,
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
		p1.resourceIdentifier.equals(p2.resourceIdentifier) &&
		p1.amount.equals(p2.amount) &&
		p1.granularity.equals(p2.granularity) &&
		p1.permissions.equals(p2.permissions),
)

export const tokenParticleProps = (input: TokenParticleInput): TokenParticle =>
	// eslint-disable-next-line  @typescript-eslint/no-unsafe-return
	pipe(withNonce, withAmount, withPermissions, withGranularity)(input)
