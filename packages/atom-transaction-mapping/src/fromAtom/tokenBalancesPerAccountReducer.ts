import {
	AnyUpParticle,
	isTransferrableTokensParticle,
	ResourceIdentifier,
} from '@radixdlt/atom'
import { Address } from '@radixdlt/crypto'
import { err, ok, Result } from 'neverthrow'
import { makeParticleReducer } from './particleReducer'
import {
	tokenBalancesForOneAccountReducer,
	empty as emptyOneAccount,
} from './tokenBalancesForOneAccountReducer'
import {
	ApplicationStateType,
	TokenBalance,
	TokenBalancesForOneAccount,
	TokenBalancesForOneAccountReducer,
	TokenBalancesPerAccount,
	TokenBalancesPerAccountReducer,
} from './_types'

export const tokenBalancesPerAccount = (
	balances: Map<Address, TokenBalancesForOneAccount>,
): TokenBalancesPerAccount => ({
	stateType: ApplicationStateType.TOKEN_BALANCES_PER_ACCOUNT,
	balances: balances,
	size: balances.size,
	balancesFor: (owner: Address): TokenBalancesForOneAccount =>
		balances.get(owner) ?? emptyOneAccount(owner),
})

export const empty = (): TokenBalancesPerAccount =>
	tokenBalancesPerAccount(new Map())

export const tokenBalancesPerAccountReducer = (): TokenBalancesPerAccountReducer => {
	let mapOwnerToOneAcccountReducer: Map<
		Address,
		TokenBalancesForOneAccountReducer
	> = new Map()
	const reducerForAccount = (
		owner: Address,
	): TokenBalancesForOneAccountReducer => {
		if (mapOwnerToOneAcccountReducer.has(owner)) {
			return mapOwnerToOneAcccountReducer.get(owner)!
		} else {
			const newReducer = tokenBalancesForOneAccountReducer(owner)
			mapOwnerToOneAcccountReducer.set(owner, newReducer)
			return newReducer
		}
	}

	return makeParticleReducer({
		applicationStateType: ApplicationStateType.TOKEN_BALANCES_PER_ACCOUNT,
		initialState: empty(),
		reduce: (
			input: Readonly<{
				state: TokenBalancesPerAccount
				upParticle: AnyUpParticle
			}>,
		): Result<TokenBalancesPerAccount, Error> => {
			if (!isTransferrableTokensParticle(input.upParticle.particle))
				return ok(input.state)

			const owner = input.upParticle.particle.address
			const oneAccountReduccer = reducerForAccount(owner)
			return oneAccountReduccer
				.reduce({
					state: input.state.balancesFor(owner),
					upParticle: input.upParticle,
				})
				.map(
					(balanceForAccountReduced): TokenBalancesPerAccount => {
						let balancePerAccount = input.state.balances
						balancePerAccount.set(owner, balanceForAccountReduced)
						return tokenBalancesPerAccount(balancePerAccount)
					},
				)
		},
		combine: (
			input: Readonly<{
				current: TokenBalancesPerAccount
				newState: TokenBalancesPerAccount
			}>,
		): Result<TokenBalancesPerAccount, Error> => err(new Error('imple me')),
	})
}
