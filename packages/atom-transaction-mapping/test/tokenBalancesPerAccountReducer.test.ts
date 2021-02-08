import { Address } from '@radixdlt/crypto'
import {
	AnyUpParticle,
	ResourceIdentifier,
	resourceIdentifierFromAddressAndName,
	TransferrableTokensParticle,
	transferrableTokensParticle,
	upParticle,
} from '@radixdlt/atom'
import { toAddress } from '@radixdlt/atom/test/helpers/utility'
import {
	Amount,
	amountInSmallestDenomination,
	eight,
	five,
	Granularity,
	isAmount,
	one,
	ten,
	three,
	seven,
	two,
	four,
	six,
} from '@radixdlt/primitives'

import { UInt256 } from '@radixdlt/uint256'
import { tokenBalancesPerAccountReducer } from '../src/fromAtom/_index'
import { eleven, fifteen } from '@radixdlt/primitives/src/_index'

describe('TokenBalancesPerAccountReducer', () => {
	const alice = toAddress(
		'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
	)

	const bob = toAddress(
		'9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
	)

	const stella = toAddress(
		'9S8PWQF9smUics1sZEo7CrYgKgCkcopvt9HfWJMTrtPyV2rg7RAG',
	)

	const aliceCoin = resourceIdentifierFromAddressAndName({
		address: alice,
		name: 'ALICE',
	})

	const stellaCoin = resourceIdentifierFromAddressAndName({
		address: stella,
		name: 'STELLA',
	})

	type AmountLike = number | Amount
	const makeAmount = (amount: AmountLike): Amount =>
		isAmount(amount)
			? amount
			: amountInSmallestDenomination(UInt256.valueOf(amount))

	const granularity: Granularity = one

	type MakeTTPInput = Readonly<{
		resourceIdentifier?: ResourceIdentifier
		owner?: Address
		amount: AmountLike
	}>

	const makeTTP = (input: MakeTTPInput): TransferrableTokensParticle =>
		transferrableTokensParticle({
			amount: makeAmount(input.amount),
			granularity,
			resourceIdentifier: input.resourceIdentifier ?? aliceCoin,
			address: input.owner ?? alice,
		})._unsafeUnwrap()

	const upTTP = (input: MakeTTPInput): AnyUpParticle =>
		upParticle(makeTTP(input)).eraseToAnyUp()

	it('should work with initial state and one TTP', () => {
		const reducer = tokenBalancesPerAccountReducer()
		const balances = reducer
			.reduceFromInitialState([
				upTTP({
					amount: ten,
					owner: alice,
					resourceIdentifier: aliceCoin,
				}),
			])
			._unsafeUnwrap()
		const alicesBalances = balances.balancesFor(alice)
		const balance = alicesBalances.balanceOf(aliceCoin)
		expect(balance).toBeDefined()
		expect(balance!.owner.equals(alice)).toBe(true)
		expect(
			balance!.tokenAmount.token.resourceIdentifier.equals(aliceCoin),
		).toBe(true)
		expect(balance!.tokenAmount.amount.equals(ten)).toBe(true)
	})

	it('should work with initial state and three TTP', () => {
		const reducer = tokenBalancesPerAccountReducer()
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
		const alicesBalances = balances.balancesFor(alice)
		const balance = alicesBalances.balanceOf(aliceCoin)
		expect(balance).toBeDefined()
		expect(balance!.owner.equals(alice)).toBe(true)
		expect(
			balance!.tokenAmount.token.resourceIdentifier.equals(aliceCoin),
		).toBe(true)
		expect(balance!.tokenAmount.amount.equals(eight)).toBe(true)
	})

	it('should work with different addresses same coin', () => {
		const reducer = tokenBalancesPerAccountReducer()
		const balances = reducer
			.reduceFromInitialState([
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
			._unsafeUnwrap()

		expect(balances.size).toBe(2)

		const alicesBalances = balances.balancesFor(alice)
		expect(alicesBalances.size).toBe(1)
		const aliceBalanceOfAliceCoin = alicesBalances.balanceOf(aliceCoin)!
		expect(aliceBalanceOfAliceCoin.owner.equals(alice)).toBe(true)
		expect(
			aliceBalanceOfAliceCoin.tokenAmount.token.resourceIdentifier.equals(
				aliceCoin,
			),
		).toBe(true)
		expect(aliceBalanceOfAliceCoin.tokenAmount.amount.equals(three)).toBe(
			true,
		)

		const bobsBalances = balances.balancesFor(bob)
		expect(bobsBalances.size).toBe(1)
		const bobBalanceOfaliceCoin = bobsBalances.balanceOf(aliceCoin)!
		expect(bobBalanceOfaliceCoin.owner.equals(bob)).toBe(true)
		expect(
			bobBalanceOfaliceCoin.tokenAmount.token.resourceIdentifier.equals(
				aliceCoin,
			),
		).toBe(true)
		expect(bobBalanceOfaliceCoin.tokenAmount.amount.equals(seven)).toBe(
			true,
		)
	})

	it('should work with initial state and TTPs with different coins same owner', () => {
		const reducer = tokenBalancesPerAccountReducer()
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
		expect(balances.size).toBe(1)

		const alicesBalances = balances.balancesFor(alice)
		expect(alicesBalances.size).toBe(2)

		const balanceAliceCoin = alicesBalances.balanceOf(aliceCoin)
		expect(balanceAliceCoin).toBeDefined()
		expect(balanceAliceCoin!.owner.equals(alice)).toBe(true)
		expect(
			balanceAliceCoin!.tokenAmount.token.resourceIdentifier.equals(
				aliceCoin,
			),
		).toBe(true)
		expect(balanceAliceCoin!.tokenAmount.amount.equals(five)).toBe(true)

		const balanceStellaCoin = alicesBalances.balanceOf(stellaCoin)
		expect(balanceStellaCoin).toBeDefined()
		expect(balanceStellaCoin!.owner.equals(alice)).toBe(true)
		expect(
			balanceStellaCoin!.tokenAmount.token.resourceIdentifier.equals(
				stellaCoin,
			),
		).toBe(true)
		expect(balanceStellaCoin!.tokenAmount.amount.equals(seven)).toBe(true)
	})

	it('should work with multiple owners each with multiple coins each with multiple particles', () => {
		const reducer = tokenBalancesPerAccountReducer()
		const balances = reducer
			.reduceFromInitialState([
				// Alices coins
				upTTP({
					amount: one,
					owner: alice,
					resourceIdentifier: aliceCoin,
				}),
				upTTP({
					amount: two,
					owner: alice,
					resourceIdentifier: aliceCoin,
				}), // alice:aliceCoin:3
				upTTP({
					amount: three,
					owner: alice,
					resourceIdentifier: stellaCoin,
				}),
				upTTP({
					amount: four,
					owner: alice,
					resourceIdentifier: stellaCoin,
				}), // alice:stellaCoin:7

				// Bobs coins
				upTTP({
					amount: five,
					owner: bob,
					resourceIdentifier: aliceCoin,
				}),
				upTTP({
					amount: six,
					owner: bob,
					resourceIdentifier: aliceCoin,
				}), // bob:aliceCoin:11

				upTTP({
					amount: seven,
					owner: bob,
					resourceIdentifier: stellaCoin,
				}),
				upTTP({
					amount: eight,
					owner: bob,
					resourceIdentifier: stellaCoin,
				}), // bob:stellaCoin:15
			])
			._unsafeUnwrap()
		expect(balances.size).toBe(2)

		const alicesBalances = balances.balancesFor(alice)
		expect(alicesBalances.size).toBe(2) // aliceCoin, stellCOiun

		const alicesBalanceOfAliceCoin = alicesBalances.balanceOf(aliceCoin)
		expect(alicesBalanceOfAliceCoin).toBeDefined()
		expect(alicesBalanceOfAliceCoin!.owner.equals(alice)).toBe(true)
		expect(
			alicesBalanceOfAliceCoin!.tokenAmount.token.resourceIdentifier.equals(
				aliceCoin,
			),
		).toBe(true)
		expect(alicesBalanceOfAliceCoin!.tokenAmount.amount.equals(three)).toBe(
			true,
		)

		const alicesBalanceOfStellaCoin = alicesBalances.balanceOf(stellaCoin)
		expect(alicesBalanceOfStellaCoin).toBeDefined()
		expect(alicesBalanceOfStellaCoin!.owner.equals(alice)).toBe(true)
		expect(
			alicesBalanceOfStellaCoin!.tokenAmount.token.resourceIdentifier.equals(
				stellaCoin,
			),
		).toBe(true)
		expect(
			alicesBalanceOfStellaCoin!.tokenAmount.amount.equals(seven),
		).toBe(true)

		const bobsBalances = balances.balancesFor(bob)
		expect(bobsBalances.size).toBe(2)

		const bobsBalanceOfAliceCoin = bobsBalances.balanceOf(aliceCoin)
		expect(bobsBalanceOfAliceCoin).toBeDefined()
		expect(bobsBalanceOfAliceCoin!.owner.equals(bob)).toBe(true)
		expect(
			bobsBalanceOfAliceCoin!.tokenAmount.token.resourceIdentifier.equals(
				aliceCoin,
			),
		).toBe(true)
		expect(bobsBalanceOfAliceCoin!.tokenAmount.amount.equals(eleven)).toBe(
			true,
		)

		const bobsBalanceOfStellaCoin = bobsBalances.balanceOf(stellaCoin)
		expect(bobsBalanceOfStellaCoin).toBeDefined()
		expect(bobsBalanceOfStellaCoin!.owner.equals(bob)).toBe(true)
		expect(
			bobsBalanceOfStellaCoin!.tokenAmount.token.resourceIdentifier.equals(
				stellaCoin,
			),
		).toBe(true)
		expect(
			bobsBalanceOfStellaCoin!.tokenAmount.amount.equals(fifteen),
		).toBe(true)
	})
})
