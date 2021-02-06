import {
	ApplicationState,
	ApplicationStateType,
	ParticleReducer,
	TokenAmount,
	TokenBalance,
	TokenBalanceReducer,
	TokenBalancesState,
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

export const tokenBalancesState = (
	balances: Map<ResourceIdentifier, TokenBalance>,
): TokenBalancesState => {
	return {
		stateType: ApplicationStateType.TOKEN_BALANCES,
		balances: balances,
		balanceOf: (_resourceIdentifier) => undefined,
	}
}

export const empty = tokenBalancesState(new Map())

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
	)
		return err(
			new Error(
				`Cannot merge TokenBalance's with different token types.`,
			),
		)
	if (!lhs.owner.equals(rhs.owner))
		return err(
			new Error(`Cannot merge TokenBalance's with different owners.`),
		)

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
		onDuplicates?: (lhsValue: V, rhsValue: V, duplicatedKey: K) => V
	}>,
): Map<K, V> => {
	const lhs = input.first
	const rhs = input.second
	const onDuplicates =
		input.onDuplicates ??
		((_yieldingLHS, dominantRHS, _Key): V => dominantRHS)

	const mergedSetOfKeys = new Set(
		([] as K[])
			.concat(Array.from<K>(lhs.keys()))
			.concat(Array.from<K>(rhs.keys())),
	)

	/* eslint-disable functional/immutable-data, functional/no-let, prefer-const */
	let combinedMap = new Map<K, V>()

	mergedSetOfKeys.forEach((key) => {
		const lhsVal = lhs.get(key)
		const rhsVal = rhs.get(key)

		if (lhsVal && rhsVal) {
			// Found duplicates...
			combinedMap.set(key, onDuplicates(lhsVal, rhsVal, key))
		} else if (lhsVal) {
			combinedMap.set(key, lhsVal)
		} else if (rhsVal) {
			combinedMap.set(key, rhsVal)
		} else {
			throw Error('Incorrect implementation, should never happen.')
		}
	})

	return combinedMap
}

const mergeKeyValueWithMap = <K, V>(
	input: Readonly<{
		first: Map<K, V>
		keyValue: { key: K; value: V }
		onDuplicates?: (lhsValue: V, rhsValue: V, duplicatedKey: K) => V
	}>,
): Map<K, V> =>
	mergeMaps({
		...input,
		second: new Map([[input.keyValue.key, input.keyValue.value]]),
	})

const addTokenBalances = (
	firstTB: TokenBalance,
	secondTB: TokenBalance,
	_key: ResourceIdentifier,
): TokenBalance => mergeTokenBalance(firstTB, secondTB).unwrapOr(firstTB)

const merge = (
	input: Readonly<{
		state: TokenBalancesState
		transferrableTokensParticle: TransferrableTokensParticle
	}>,
): TokenBalancesState => {
	const balances = input.state.balances
	const tokenParticle = input.transferrableTokensParticle
	return tokenBalancesState(
		mergeKeyValueWithMap({
			first: balances,
			keyValue: {
				key: tokenParticle.resourceIdentifier,
				value: tokenBalance(tokenParticle),
			},
			onDuplicates: addTokenBalances,
		}),
	)
}

export const tokenBalanceReducer = (): TokenBalanceReducer =>
	makeParticleReducer({
		applicationStateType: ApplicationStateType.TOKEN_BALANCES,
		initialState: empty,
		reduce: (
			input: Readonly<{
				state: TokenBalancesState
				upParticle: AnyUpParticle
			}>,
		): TokenBalancesState => {
			if (!isTransferrableTokensParticle(input.upParticle.particle))
				return input.state
			return merge({
				state: input.state,
				transferrableTokensParticle: input.upParticle.particle,
			})
		},
		combine: (
			input: Readonly<{
				current: TokenBalancesState
				newState: TokenBalancesState
			}>,
		): TokenBalancesState => {
			if (mapEquals(input.current.balances, input.newState.balances))
				return input.current

			return tokenBalancesState(
				mergeMaps({
					first: input.current.balances,
					second: input.newState.balances,
					onDuplicates: addTokenBalances,
				}),
			)
		},
	})
