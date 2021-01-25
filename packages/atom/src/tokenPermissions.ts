import {
	IsOwnerOfToken,
	TokenPermission,
	TokenPermissions,
	TokenTransition,
} from './_types'

import { mapEquals } from '@radixdlt/util'

export const makeTokenPermissions = (
	permissions: ReadonlyMap<TokenTransition, TokenPermission>,
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
		const permission = permissions.get(transition)
		if (permission) {
			return permission
		}
		// eslint-disable-next-line functional/no-throw-statement
		throw new Error(
			`Incorrect implementation - expected value for REQUIRED permission with key: ${transition.valueOf()}, but got none`,
		)
	}

	const mintPermission = valueOfRequiredPermission(TokenTransition.MINT)
	const burnPermission = valueOfRequiredPermission(TokenTransition.BURN)

	return {
		permissions,
		canBeMinted: (isOwnerOfToken: IsOwnerOfToken): boolean =>
			check({ permission: mintPermission, isOwnerOfToken }),
		canBeBurned: (isOwnerOfToken: IsOwnerOfToken): boolean =>
			check({ permission: burnPermission, isOwnerOfToken }),

		equals: (other: TokenPermissions): boolean =>
			mapEquals(permissions, other.permissions),
	}
}

export const tokenPermissionsAll: TokenPermissions = makeTokenPermissions(
	new Map([
		[TokenTransition.BURN, TokenPermission.ALL],
		[TokenTransition.MINT, TokenPermission.ALL],
	]),
)

export const tokenOwnerOnly: TokenPermissions = makeTokenPermissions(
	new Map([
		[TokenTransition.BURN, TokenPermission.TOKEN_OWNER_ONLY],
		[TokenTransition.MINT, TokenPermission.TOKEN_OWNER_ONLY],
	]),
)
