import {
	ApplicationState,
	ApplicationStateType,
	ParticleReducer,
	TokenAmount,
	TokenBalance,
	TokenBalanceForOneAccountReducer,
	TokenBalanceForOneAccount,
} from './_types'
import {
	AnyUpParticle,
	ResourceIdentifier,
	TokenBase,
	TransferrableTokensParticle,
} from '@radixdlt/atom'
import { isTransferrableTokensParticle } from '@radixdlt/atom/dist/particles/transferrableTokensParticle'
import { err, ok, Result } from 'neverthrow'
import { mapEquals } from '@radixdlt/util'
import { makeParticleReducer } from './particleReducer'
import { Address } from '@radixdlt/crypto'

export const tokenBalanceForOneAccount = (
	input: Readonly<{
		owner: Address
		balances: Map<ResourceIdentifier, TokenBalance>
	}>,
): TokenBalanceForOneAccount => ({
	stateType: ApplicationStateType.TOKEN_BALANCE_FOR_ONE_ACCOUNT,
	balances: input.balances,
	owner: input.owner,
	size: input.balances.size,
	balanceOf: (resourceIdentifier: ResourceIdentifier) =>
		input.balances.get(resourceIdentifier),
})

export const empty = (owner: Address): TokenBalanceForOneAccount =>
	tokenBalanceForOneAccount({ owner, balances: new Map() })

export const tokenBalance = (
	ttp: TransferrableTokensParticle,
): TokenBalance => {
	return {
		owner: ttp.address,
		tokenAmount: <TokenAmount>{
			amount: ttp.amount,
			token: ttp as TokenBase,
		},
	}
}

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
		return err(
			new Error(`Cannot merge TokenBalance's with different owners.`),
		)
	}

	return lhs.tokenAmount.amount.adding(rhs.tokenAmount.amount).map((sum) => ({
		owner: lhs.owner,
		tokenAmount: <TokenAmount>{
			token: lhs.tokenAmount.token,
			amount: sum,
		},
	}))
}

export const mergeMaps = <K, V>(
	input: Readonly<{
		first: Map<K, V>
		second: Map<K, V>
		onDuplicates?: (
			lhsValue: V,
			rhsValue: V,
			duplicatedKey: K,
		) => Result<V, Error>
	}>,
): Result<Map<K, V>, Error> => {
	const lhs = input.first
	const rhs = input.second
	const onDuplicates =
		input.onDuplicates ??
		((_yieldingLHS, dominantRHS, _Key): Result<V, Error> => ok(dominantRHS))

	const mergedSetOfKeys = new Set(
		([] as K[])
			.concat(Array.from<K>(lhs.keys()))
			.concat(Array.from<K>(rhs.keys())),
	)

	/* eslint-disable functional/immutable-data, functional/no-let, prefer-const */
	let combinedMap = new Map<K, V>()

	for (const key of mergedSetOfKeys) {
		//.forEach((key) => {
		const lhsVal = lhs.get(key)
		const rhsVal = rhs.get(key)

		if (lhsVal && rhsVal) {
			// Found duplicates...
			const mergeResult = onDuplicates(lhsVal, rhsVal, key)
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

const mergeKeyValueWithMap = <K, V>(
	input: Readonly<{
		first: Map<K, V>
		keyValue: { key: K; value: V }
		onDuplicates?: (
			lhsValue: V,
			rhsValue: V,
			duplicatedKey: K,
		) => Result<V, Error>
	}>,
): Result<Map<K, V>, Error> =>
	mergeMaps({
		...input,
		second: new Map([[input.keyValue.key, input.keyValue.value]]),
	})

const addTokenBalances = (
	firstTB: TokenBalance,
	secondTB: TokenBalance,
	_key: ResourceIdentifier,
): Result<TokenBalance, Error> => mergeTokenBalance(firstTB, secondTB)

const merge = (
	input: Readonly<{
		state: TokenBalanceForOneAccount
		transferrableTokensParticle: TransferrableTokensParticle
	}>,
): Result<TokenBalanceForOneAccount, Error> => {
	const balances = input.state.balances
	const tokenParticle = input.transferrableTokensParticle

	return mergeKeyValueWithMap({
		first: balances,
		keyValue: {
			key: tokenParticle.resourceIdentifier,
			value: tokenBalance(tokenParticle),
		},
		onDuplicates: addTokenBalances,
	}).map((balances) =>
		tokenBalanceForOneAccount({
			owner: input.state.owner,
			balances: balances,
		}),
	)
}

export const tokenBalanceForOneAccountReducer = (
	owner: Address,
): TokenBalanceForOneAccountReducer =>
	makeParticleReducer({
		applicationStateType:
			ApplicationStateType.TOKEN_BALANCE_FOR_ONE_ACCOUNT,
		initialState: empty(owner),
		reduce: (
			input: Readonly<{
				state: TokenBalanceForOneAccount
				upParticle: AnyUpParticle
			}>,
		): Result<TokenBalanceForOneAccount, Error> => {
			if (!isTransferrableTokensParticle(input.upParticle.particle))
				return ok(input.state)
			return merge({
				state: input.state,
				transferrableTokensParticle: input.upParticle.particle,
			})
		},
		combine: (
			input: Readonly<{
				current: TokenBalanceForOneAccount
				newState: TokenBalanceForOneAccount
			}>,
		): Result<TokenBalanceForOneAccount, Error> => {
			if (
				!input.current.owner.equals(owner) ||
				!input.current.owner.equals(input.newState.owner)
			)
				throw new Error('Incorrect implementation, owner mismatch')
			if (mapEquals(input.current.balances, input.newState.balances))
				return ok(input.current)

			return mergeMaps({
				first: input.current.balances,
				second: input.newState.balances,
				onDuplicates: addTokenBalances,
			}).map((balances) =>
				tokenBalanceForOneAccount({
					owner: input.current.owner,
					balances: balances,
				}),
			)
		},
	})
