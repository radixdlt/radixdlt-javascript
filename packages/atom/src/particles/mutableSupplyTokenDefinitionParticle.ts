import { TokenPermission, TokenTransition } from '../_types'
import { Result, err, ok } from 'neverthrow'
import { RadixParticleType } from './meta/radixParticleTypes'

import { tokenOwnerOnly } from '../tokenPermissions'
import {
	baseTokenDefinitionParticle,
	isTokenDefinitionParticleBase,
	TokenDefinitionParticleInput,
} from './tokenDefinitionParticleBase'
import {
	MutableSupplyTokenDefinitionParticleT,
	ParticleBase,
	TokenDefinitionParticleBase,
} from './_types'
import { ResourceIdentifier } from '../resourceIdentifier'
import { JSONDecoding, serializerDecoder } from '@radixdlt/data-formats'
import { Address } from '@radixdlt/account'
import { Amount } from '@radixdlt/primitives'
import { makeTokenPermissions } from '../_index'

const radixParticleType = RadixParticleType.MUTABLE_SUPPLY_TOKEN_DEFINITION

const SERIALIZER = 'radix.particles.mutable_supply_token_definition'

const jsonDecoding = JSONDecoding<MutableSupplyTokenDefinitionParticleT>(
	ResourceIdentifier,
	Address,
	Amount,
)(
	serializerDecoder(
		SERIALIZER
	)
		((
			input: TokenDefinitionParticleInput &
				Readonly<{
					permissions?: Readonly<
						{ [key in TokenTransition]: TokenPermission }
					>
				}>,
		) => create(input),
	),
)

const validateTokenPermissions = (
	permissions: Readonly<{ [key in TokenTransition]: TokenPermission }>,
): Result<Readonly<{ [key in TokenTransition]: TokenPermission }>, Error> => {
	return permissions.mint === TokenPermission.ALL ||
		permissions.mint === TokenPermission.TOKEN_OWNER_ONLY
		? ok(permissions)
		: err(new Error('Someone must have permission to mint.'))
}

const create = (
	input: TokenDefinitionParticleInput &
		Readonly<{
			permissions?: Readonly<
				{ [key in TokenTransition]: TokenPermission }
			>
		}>,
): Result<MutableSupplyTokenDefinitionParticleT, Error> => {
	return validateTokenPermissions(
		input.permissions ?? tokenOwnerOnly.permissions,
	).andThen((permissions) => {
		return baseTokenDefinitionParticle({
			...input,
			serializer: SERIALIZER,
			radixParticleType:
				RadixParticleType.MUTABLE_SUPPLY_TOKEN_DEFINITION,

			specificEncodableKeyValues: {
				permissions,
			},

			// eslint-disable-next-line complexity
			makeEquals: (
				thisParticle: TokenDefinitionParticleBase,
				other: ParticleBase,
				// eslint-disable-next-line max-params
			): boolean => {
				if (!isMutableTokenDefinitionParticle(other)) return false
				const oterhMSTDP = other
				const equalsBase =
					oterhMSTDP.name === thisParticle.name &&
					oterhMSTDP.description === thisParticle.description &&
					oterhMSTDP.granularity.equals(thisParticle.granularity) &&
					oterhMSTDP.resourceIdentifier.equals(
						thisParticle.resourceIdentifier,
					) &&
					oterhMSTDP.url === thisParticle.url &&
					oterhMSTDP.iconURL === thisParticle.iconURL

				return (
					equalsBase &&
					oterhMSTDP.permissions.equals(
						makeTokenPermissions(permissions),
					)
				)
			},
		}).map(
			(
				base: TokenDefinitionParticleBase,
			): MutableSupplyTokenDefinitionParticleT => ({
				...base,
				permissions: makeTokenPermissions(permissions),
			}),
		)
	})
}

export const isMutableTokenDefinitionParticle = (
	something: unknown,
): something is MutableSupplyTokenDefinitionParticleT => {
	if (!isTokenDefinitionParticleBase(something)) return false
	return something.radixParticleType === radixParticleType
}

export const MutableSupplyTokenDefinitionParticle = {
	SERIALIZER,
	create,
	...jsonDecoding
}
