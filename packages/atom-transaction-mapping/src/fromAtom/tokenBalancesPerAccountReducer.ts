import { AnyUpParticle, isTransferrableTokensParticle } from '@radixdlt/atom'
import { TransferrableTokensParticleT } from '@radixdlt/atom/src/_index'
import { AddressT } from '@radixdlt/crypto/src/_types'
import { mapEquals } from '@radixdlt/util'
import { ok, Result } from 'neverthrow'
import { makeParticleReducer } from './particleReducer'
import {
	tokenBalancesForOneAccountReducer,
	tokenBalancesForOneAccountFromParticle,
	mergeMaps,
	emptyTokenBalancesForOneAccount,
} from './tokenBalancesForOneAccountReducer'
import {
	ApplicationStateType,
	TokenBalancesForOneAccount,
	TokenBalancesPerAccount,
	TokenBalancesPerAccountReducer,
} from './_types'

export const tokenBalancesPerAccount = (
	balances: Map<AddressT, TokenBalancesForOneAccount>,
): TokenBalancesPerAccount => ({
	stateType: ApplicationStateType.TOKEN_BALANCES_PER_ACCOUNT,
	balances: balances,
	size: balances.size,
	balancesFor: (owner: AddressT): TokenBalancesForOneAccount =>
		balances.get(owner) ?? emptyTokenBalancesForOneAccount(owner),
})

const tokenBalancesPerAccountFromParticle = (
	particle: TransferrableTokensParticleT,
): TokenBalancesPerAccount => {
	const tokenBalancesForOneAccount_ = tokenBalancesForOneAccountFromParticle(
		particle,
	)
	return tokenBalancesPerAccount(
		new Map([[particle.address, tokenBalancesForOneAccount_]]),
	)
}

export const emptyTokenBalancesPerAccount = (): TokenBalancesPerAccount =>
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
		initialState: emptyTokenBalancesPerAccount(),
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
