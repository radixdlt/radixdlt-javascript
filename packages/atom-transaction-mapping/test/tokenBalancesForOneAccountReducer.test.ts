import {
	AnyUpParticle,
	ResourceIdentifier,
	ResourceIdentifierT,
	TransferrableTokensParticle,
	TransferrableTokensParticleT,
	upParticle,
} from '@radixdlt/atom'
import { toAddress } from '@radixdlt/atom/test/helpers/utility'
import {
	eight,
	five,
	Granularity,
	isAmount,
	one,
	ten,
	three,
	seven,
	two,
	AmountT,
	Amount,
} from '@radixdlt/primitives'
import { tokenBalancesForOneAccountReducer } from '../src/fromAtom/tokenBalancesForOneAccountReducer'

import { UInt256 } from '@radixdlt/uint256'

import { AddressT } from '@radixdlt/account'

describe('TokenBalancesForOneAccountReducer', () => {
	const alice = toAddress(
		'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
	)

	const bob = toAddress(
		'9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
	)

	const stella = toAddress(
		'9S8PWQF9smUics1sZEo7CrYgKgCkcopvt9HfWJMTrtPyV2rg7RAG',
	)

	const aliceCoin = ResourceIdentifier.fromAddressAndName({
		address: alice,
		name: 'ALICE',
	})

	const stellaCoin = ResourceIdentifier.fromAddressAndName({
		address: stella,
		name: 'STELLA',
	})

	type AmountLike = number | AmountT
	const makeAmount = (amount: AmountLike): AmountT =>
		isAmount(amount)
			? amount
			: Amount.inSmallestDenomination(UInt256.valueOf(amount))

	const granularity: Granularity = one

	type MakeTTPInput = Readonly<{
		resourceIdentifier?: ResourceIdentifierT
		owner?: AddressT
		amount: AmountLike
	}>

	const makeTTP = (input: MakeTTPInput): TransferrableTokensParticleT =>
		TransferrableTokensParticle.create({
			amount: makeAmount(input.amount),
			granularity,
			resourceIdentifier: input.resourceIdentifier ?? aliceCoin,
			address: input.owner ?? alice,
		})._unsafeUnwrap()

	const upTTP = (input: MakeTTPInput): AnyUpParticle =>
		upParticle(makeTTP(input)).eraseToAnyUp()

	it('should work with initial state and one TTP', () => {
		const reducer = tokenBalancesForOneAccountReducer(alice)
		const balances = reducer
			.reduceFromInitialState([
				upTTP({
					amount: ten,
					owner: alice,
					resourceIdentifier: aliceCoin,
				}),
			])
			._unsafeUnwrap()
		const balance = balances.balanceOf(aliceCoin)
		expect(balance).toBeDefined()
		expect(balance!.owner.equals(alice)).toBe(true)
		expect(
			balance!.tokenAmount.token.resourceIdentifier.equals(aliceCoin),
		).toBe(true)
		expect(balance!.tokenAmount.amount.equals(ten)).toBe(true)
	})

	it('should work with initial state and three TTP', () => {
		const reducer = tokenBalancesForOneAccountReducer(alice)
		const balances = reducer
			.reduceFromInitialState([
				upTTP({
					amount: one,
					owner: alice,
					resourceIdentifier: aliceCoin,
				}),
				upTTP({
					amount: two,
					owner: alice,
					resourceIdentifier: aliceCoin,
				}),
				upTTP({
					amount: five,
					owner: alice,
					resourceIdentifier: aliceCoin,
				}),
			])
			._unsafeUnwrap()
		expect(balances.size).toBe(1)
		const balance = balances.balanceOf(aliceCoin)
		expect(balance).toBeDefined()
		expect(balance!.owner.equals(alice)).toBe(true)
		expect(
			balance!.tokenAmount.token.resourceIdentifier.equals(aliceCoin),
		).toBe(true)
		expect(balance!.tokenAmount.amount.equals(eight)).toBe(true)
	})

	it('should fail with address mismatch error for TTPS belonging to different addresses', () => {
		const reducer = tokenBalancesForOneAccountReducer(alice)
		const balancesResult = reducer.reduceFromInitialState([
			upTTP({
				amount: three,
				owner: alice,
				resourceIdentifier: aliceCoin,
			}),
			upTTP({
				amount: seven,
				owner: bob,
				resourceIdentifier: aliceCoin,
			}),
		])

		balancesResult.match(
			() => {
				throw Error('expected error, but got none')
			},
			(f) =>
				expect(f.message).toBe(
					`Cannot merge TokenBalance's with different owners.`,
				),
		)
	})

	it('should work with initial state and TTPs with different coins', () => {
		const reducer = tokenBalancesForOneAccountReducer(alice)
		const balances = reducer
			.reduceFromInitialState([
				upTTP({
					amount: five,
					owner: alice,
					resourceIdentifier: aliceCoin,
				}),
				upTTP({
					amount: seven,
					owner: alice,
					resourceIdentifier: stellaCoin,
				}),
			])
			._unsafeUnwrap()
		expect(balances.size).toBe(2)

		const balanceAliceCoin = balances.balanceOf(aliceCoin)
		expect(balanceAliceCoin).toBeDefined()
		expect(balanceAliceCoin!.owner.equals(alice)).toBe(true)
		expect(
			balanceAliceCoin!.tokenAmount.token.resourceIdentifier.equals(
				aliceCoin,
			),
		).toBe(true)
		expect(balanceAliceCoin!.tokenAmount.amount.equals(five)).toBe(true)

		const balanceStellaCoin = balances.balanceOf(stellaCoin)
		expect(balanceStellaCoin).toBeDefined()
		expect(balanceStellaCoin!.owner.equals(alice)).toBe(true)
		expect(
			balanceStellaCoin!.tokenAmount.token.resourceIdentifier.equals(
				stellaCoin,
			),
		).toBe(true)
		expect(balanceStellaCoin!.tokenAmount.amount.equals(seven)).toBe(true)
	})
})
