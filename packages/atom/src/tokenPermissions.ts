import {
	IsOwnerOfToken,
	TokenPermission,
	TokenPermissions,
	TokenTransition,
} from './_types'

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
			case TokenPermission.All:
				return true
			case TokenPermission.None:
				return false
			case TokenPermission.TokenOwnerOnly:
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

	const mintPermission = valueOfRequiredPermission(TokenTransition.Mint)
	const burnPermission = valueOfRequiredPermission(TokenTransition.Burn)

	return {
		canBeMinted: (isOwnerOfToken: IsOwnerOfToken): boolean =>
			check({ permission: mintPermission, isOwnerOfToken }),
		canBeBurned: (isOwnerOfToken: IsOwnerOfToken): boolean =>
			check({ permission: burnPermission, isOwnerOfToken }),
	}
}

export const tokenPermissionsAll: TokenPermissions = makeTokenPermissions(
	new Map([
		[TokenTransition.Burn, TokenPermission.All],
		[TokenTransition.Mint, TokenPermission.All],
	]),
)

export const tokenOwnerOnly: TokenPermissions = makeTokenPermissions(
	new Map([
		[TokenTransition.Burn, TokenPermission.TokenOwnerOnly],
		[TokenTransition.Mint, TokenPermission.TokenOwnerOnly],
	]),
)
