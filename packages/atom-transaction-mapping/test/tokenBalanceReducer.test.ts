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
	two,
} from '@radixdlt/primitives'
import { empty, tokenBalanceReducer } from '../src/fromAtom/tokenBalanceReducer'

import { UInt256 } from '@radixdlt/uint256'

describe('TokenBalanceReducer', () => {
	const alice = toAddress(
		'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
	)

	const aliceCoin = resourceIdentifierFromAddressAndName({
		address: alice,
		name: 'ALICE',
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
		const reducer = tokenBalanceReducer()
		const balances = reducer.reduceFromInitialState([
			upTTP({
				amount: ten,
				owner: alice,
				resourceIdentifier: aliceCoin,
			}),
		])
		const balance = balances.balanceOf(aliceCoin)
		expect(balance).toBeDefined()
		expect(balance!.owner.equals(alice)).toBe(true)
		expect(
			balance!.tokenAmount.token.resourceIdentifier.equals(aliceCoin),
		).toBe(true)
		expect(balance!.tokenAmount.amount.equals(ten)).toBe(true)
	})

	it('should work with initial state and three TTP', () => {
		const reducer = tokenBalanceReducer()
		const balances = reducer.reduceFromInitialState([
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
		expect(balances.size).toBe(1)
		const balance = balances.balanceOf(aliceCoin)
		expect(balance).toBeDefined()
		expect(balance!.owner.equals(alice)).toBe(true)
		expect(
			balance!.tokenAmount.token.resourceIdentifier.equals(aliceCoin),
		).toBe(true)
		expect(balance!.tokenAmount.amount.equals(eight)).toBe(true)
	})
})

/*
    func testMultipleMintedTokens() throws {
        let reducer = TokenBalanceReferencesReducer()
    
        let balances = try reducer.reduceFromInitialState(upParticles: [
            transferrable(3),
            transferrable(5),
            transferrable(11)
            ])

        guard let xrdBalance = balances[xrd] else { return XCTFail("Should not be nil") }
        XCTAssertEqual(xrdBalance.amount, 19)
    }
*/
