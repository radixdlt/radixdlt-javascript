import { objectEquals } from '@radixdlt/util'
import {
	IsOwnerOfToken,
	TokenPermission,
	TokenPermissions,
	TokenTransition,
} from './_types'

export const makeTokenPermissions = (
	permissions: Readonly<{ [key in TokenTransition]: TokenPermission }>,
): TokenPermissions => {
	const check = (
		input: Readonly<{
			permission: TokenPermission
			isOwnerOfToken: IsOwnerOfToken
		}>,
	): boolean => {
		switch (input.permission) {
			case TokenPermission.ALL:
				return true
			case TokenPermission.NONE:
				return false
			case TokenPermission.TOKEN_OWNER_ONLY:
				return input.isOwnerOfToken()
		}
	}

	const valueOfRequiredPermission = (
		transition: TokenTransition,
	): TokenPermission => {
		const permission = permissions[transition]
		if (permission) {
			return permission
		}

		throw new Error(
			`Incorrect implementation - expected value for REQUIRED permission with key: ${transition.valueOf()}, but got none`,
		)
	}

	const mintPermission = valueOfRequiredPermission(TokenTransition.MINT)
	const burnPermission = valueOfRequiredPermission(TokenTransition.BURN)

	return {
		permissions,
		mintPermission,
		canBeMinted: (isOwnerOfToken: IsOwnerOfToken): boolean =>
			check({ permission: mintPermission, isOwnerOfToken }),
		canBeBurned: (isOwnerOfToken: IsOwnerOfToken): boolean =>
			check({ permission: burnPermission, isOwnerOfToken }),

		equals: (other: TokenPermissions): boolean =>
			objectEquals(permissions, other.permissions),
	}
}

export const tokenPermissionsAll: TokenPermissions = makeTokenPermissions({
	[TokenTransition.BURN]: TokenPermission.ALL,
	[TokenTransition.MINT]: TokenPermission.ALL,
})

export const tokenOwnerOnly: TokenPermissions = makeTokenPermissions({
	[TokenTransition.BURN]: TokenPermission.TOKEN_OWNER_ONLY,
	[TokenTransition.MINT]: TokenPermission.TOKEN_OWNER_ONLY,
})
