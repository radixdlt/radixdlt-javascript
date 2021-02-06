import {
	AnyUpParticle,
	isTransferrableTokensParticle,
	ResourceIdentifier,
	TransferrableTokensParticle,
} from '@radixdlt/atom'
import { Address } from '@radixdlt/crypto'
import { mapEquals } from '@radixdlt/util'
import { combine, err, ok, Result } from 'neverthrow'
import { makeParticleReducer } from './particleReducer'
import {
	tokenBalancesForOneAccountReducer,
	empty as emptyOneAccount,
	tokenBalancesForOneAccountFromParticle,
	mergeMaps,
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

const tokenBalancesPerAccountFromParticle = (
	particle: TransferrableTokensParticle,
): TokenBalancesPerAccount => {
	const tokenBalancesForOneAccount_ = tokenBalancesForOneAccountFromParticle(
		particle,
	)
	return tokenBalancesPerAccount(
		new Map([[particle.address, tokenBalancesForOneAccount_]]),
	)
}

export const empty = (): TokenBalancesPerAccount =>
	tokenBalancesPerAccount(new Map())

export const tokenBalancesPerAccountReducer = (): TokenBalancesPerAccountReducer => {
	const combine = (
		input: Readonly<{
			current: TokenBalancesPerAccount
			newState: TokenBalancesPerAccount
		}>,
	): Result<TokenBalancesPerAccount, Error> => {
		const currentBalancesMap = input.current.balances
		const newBalancesMap = input.newState.balances
		if (mapEquals(currentBalancesMap, newBalancesMap))
			return ok(input.current)

		return mergeMaps({
			first: currentBalancesMap,
			second: newBalancesMap,
			onDuplicates: (a, b, _) =>
				tokenBalancesForOneAccountReducer(a.owner).combine({
					current: a,
					newState: b,
				}),
		}).map((balances) => tokenBalancesPerAccount(balances))
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
			const particle = input.upParticle.particle
			if (!isTransferrableTokensParticle(particle)) return ok(input.state)
			const tokenBalancesPerAccount_ = tokenBalancesPerAccountFromParticle(
				particle,
			)
			return combine({
				current: input.state,
				newState: tokenBalancesPerAccount_,
			})
		},
		combine: combine,
	})
}
