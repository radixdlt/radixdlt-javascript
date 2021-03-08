import {
	ApplicationStateType,
	TokenBalance,
	TokenBalancesForOneAccountReducer,
	TokenBalancesForOneAccount,
} from './_types'
import {
	AnyUpParticle,
	TokenBase,
	TransferrableTokensParticleT,
} from '@radixdlt/atom'
import { isTransferrableTokensParticle } from '@radixdlt/atom'
import { err, ok, Result } from 'neverthrow'
import { mapEquals } from '@radixdlt/util'
import { makeParticleReducer } from './particleReducer'
import { ResourceIdentifierT } from '@radixdlt/atom/src/_types'
import { AddressT } from '@radixdlt/account'

export const tokenBalancesForOneAccount = (
	input: Readonly<{
		owner: AddressT
		balances: Map<ResourceIdentifierT, TokenBalance>
	}>,
): TokenBalancesForOneAccount => ({
	stateType: ApplicationStateType.TOKEN_BALANCES_FOR_ONE_ACCOUNT,
	balances: input.balances,
	owner: input.owner,
	size: input.balances.size,
	balanceOf: (resourceIdentifier: ResourceIdentifierT) =>
		input.balances.get(resourceIdentifier),
})

export const tokenBalancesForOneAccountFromParticle = (
	transferrableTokensParticle: TransferrableTokensParticleT,
): TokenBalancesForOneAccount => {
	const tokenBalance_ = tokenBalance(transferrableTokensParticle)
	return tokenBalancesForOneAccount({
		owner: transferrableTokensParticle.address,
		balances: new Map<ResourceIdentifierT, TokenBalance>([
			[transferrableTokensParticle.resourceIdentifier, tokenBalance_],
		]),
	})
}

export const emptyTokenBalancesForOneAccount = (
	owner: AddressT,
): TokenBalancesForOneAccount =>
	tokenBalancesForOneAccount({
		owner,
		balances: new Map<ResourceIdentifierT, TokenBalance>(),
	})

export const tokenBalance = (
	ttp: TransferrableTokensParticleT,
): TokenBalance => {
	return {
		owner: ttp.address,
		tokenAmount: {
			amount: ttp.amount,
			token: ttp as TokenBase,
		},
	}
}

const ownerMismatchError = new Error(
	`Cannot merge TokenBalance's with different owners.`,
)

export const mergeTokenBalance = (
	lhs: TokenBalance,
	rhs: TokenBalance,
): Result<TokenBalance, Error> => {
	if (
		!lhs.tokenAmount.token.resourceIdentifier.equals(
			rhs.tokenAmount.token.resourceIdentifier,
		)
	) {
		return err(
			new Error(
				`Cannot merge TokenBalance's with different token types.`,
			),
		)
	}
	if (!lhs.owner.equals(rhs.owner)) {
		return err(ownerMismatchError)
	}

	return lhs.tokenAmount.amount.adding(rhs.tokenAmount.amount).map((sum) => ({
		owner: lhs.owner,
		tokenAmount: {
			token: lhs.tokenAmount.token,
			amount: sum,
		},
	}))
}

export const mergeMaps = <K, V>(
	input: Readonly<{
		first: Map<K, V>
		second: Map<K, V>
		onDuplicates: (
			lhsValue: V,
			rhsValue: V,
			duplicatedKey: K,
		) => Result<V, Error>
	}>,
): Result<Map<K, V>, Error> => {
	const lhs = input.first
	const rhs = input.second

	const uniqueKeys = Array.from(
		new Set(
			([] as K[])
				.concat(Array.from<K>(lhs.keys()))
				.concat(Array.from<K>(rhs.keys())),
		),
	)

	/* eslint-disable functional/immutable-data, functional/no-let, functional/no-loop-statement, prefer-const */
	let combinedMap = new Map<K, V>()

	for (const key of uniqueKeys) {
		const lhsVal = lhs.get(key)
		const rhsVal = rhs.get(key)

		if (lhsVal && rhsVal) {
			// Found duplicates...
			const mergeResult = input.onDuplicates(lhsVal, rhsVal, key)
			if (mergeResult.isOk()) {
				combinedMap.set(key, mergeResult.value)
			} else {
				return err(mergeResult.error)
			}
		} else if (lhsVal) {
			combinedMap.set(key, lhsVal)
		} else if (rhsVal) {
			combinedMap.set(key, rhsVal)
		} else {
			throw Error('Incorrect implementation, should never happen.')
		}
	}

	return ok(combinedMap)
}

// eslint-disable-next-line max-lines-per-function
export const tokenBalancesForOneAccountReducer = (
	owner: AddressT,
): TokenBalancesForOneAccountReducer => {
	const combine = (
		input: Readonly<{
			current: TokenBalancesForOneAccount
			newState: TokenBalancesForOneAccount
		}>,
	): Result<TokenBalancesForOneAccount, Error> => {
		if (
			!input.current.owner.equals(owner) ||
			!input.current.owner.equals(input.newState.owner)
		)
			return err(new Error('Incorrect implementation, owner mismatch'))
		if (mapEquals(input.current.balances, input.newState.balances))
			return ok(input.current)

		return mergeMaps({
			first: input.current.balances,
			second: input.newState.balances,
			onDuplicates: (a, b, _) => mergeTokenBalance(a, b),
		}).map((balances) =>
			tokenBalancesForOneAccount({
				owner: input.current.owner,
				balances: balances,
			}),
		)
	}

	return makeParticleReducer({
		applicationStateType:
			ApplicationStateType.TOKEN_BALANCES_FOR_ONE_ACCOUNT,
		initialState: emptyTokenBalancesForOneAccount(owner),
		reduce: (
			input: Readonly<{
				state: TokenBalancesForOneAccount
				upParticle: AnyUpParticle
			}>,
		): Result<TokenBalancesForOneAccount, Error> => {
			const particle = input.upParticle.particle
			if (!isTransferrableTokensParticle(particle)) return ok(input.state)
			if (!particle.address.equals(owner)) return err(ownerMismatchError)
			const tokenBalancesForOneAccount_ = tokenBalancesForOneAccountFromParticle(
				particle,
			)
			return combine({
				current: input.state,
				newState: tokenBalancesForOneAccount_,
			})
		},
		combine: combine,
	})
}
