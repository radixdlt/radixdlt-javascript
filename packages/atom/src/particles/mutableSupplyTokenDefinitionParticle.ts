import { TokenPermission, TokenPermissions } from '../_types'
import { Result, err, ok } from 'neverthrow'
import { RadixParticleType } from './meta/radixParticleTypes'

import { tokenOwnerOnly } from '../tokenPermissions'
import {
	baseTokenDefinitionParticle,
	isTokenDefinitionParticleBase,
	TokenDefinitionParticleInput,
} from './tokenDefinitionParticleBase'
import {
	MutableSupplyTokenDefinitionParticle,
	ParticleBase,
	TokenDefinitionParticleBase,
} from './_types'

const radixParticleType = RadixParticleType.MUTABLE_SUPPLY_TOKEN_DEFINITION

const validateTokenPermissions = (
	permissions: TokenPermissions,
): Result<TokenPermissions, Error> => {
	return permissions.mintPermission === TokenPermission.ALL ||
		permissions.mintPermission === TokenPermission.TOKEN_OWNER_ONLY
		? ok(permissions)
		: err(new Error('Someone must have permission to mint.'))
}

export const mutableSupplyTokenDefinitionParticle = (
	input: TokenDefinitionParticleInput &
		Readonly<{
			permissions?: TokenPermissions
		}>,
): Result<MutableSupplyTokenDefinitionParticle, Error> => {
	return validateTokenPermissions(
		input.permissions ?? tokenOwnerOnly,
	).andThen((permissions) => {
		return baseTokenDefinitionParticle({
			...input,
			serializer: 'radix.particles.mutable_supply_token_definition',
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

				return equalsBase && oterhMSTDP.permissions.equals(permissions)
			},
		}).map(
			(
				base: TokenDefinitionParticleBase,
			): MutableSupplyTokenDefinitionParticle => ({
				...base,
				permissions: permissions,
			}),
		)
	})
}

export const isMutableTokenDefinitionParticle = (
	something: unknown,
): something is MutableSupplyTokenDefinitionParticle => {
	if (!isTokenDefinitionParticleBase(something)) return false
	return something.radixParticleType === radixParticleType
}
