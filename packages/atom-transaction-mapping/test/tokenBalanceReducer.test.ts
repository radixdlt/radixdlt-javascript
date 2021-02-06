import { Address } from '@radixdlt/crypto'
import {
	ResourceIdentifier,
	resourceIdentifierFromAddressAndName,
	TransferrableTokensParticle,
	transferrableTokensParticle,
} from '@radixdlt/atom'
import { toAddress } from '@radixdlt/atom/test/helpers/utility'
import {
	Amount,
	amountInSmallestDenomination,
	Granularity,
	isAmount,
	one,
} from '@radixdlt/primitives'
import { empty, tokenBalanceReducer } from '../src/fromAtom/tokenBalanceReducer'

import { UInt256 } from '@radixdlt/uint256'

describe('TokenBalanceReducer', () => {
	const alice = toAddress(
		'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
	)

	const resourceIdentifier = resourceIdentifierFromAddressAndName({
		address: alice,
		name: 'ALICE',
	})

	type AmountLike = number | Amount
	const makeAmount = (amount: AmountLike): Amount =>
		isAmount(amount)
			? amount
			: amountInSmallestDenomination(UInt256.valueOf(amount))

	const granularity: Granularity = one
	// const makeTTP = (
	// 	resourceIdentifier: ResourceIdentifier,
	// 	owner: Address,
	// 	amount: AmountLike,
	// ): TransferrableTokensParticle => transferrableTokensParticle({
	// 			amount: makeAmount(amount),
	// 			granularity,
	// 			resourceIdentifier: resourceIdentifier,
	// 			address: owner,
	// 	})._unsafeUnwrap(),

	it('should work', () => {
		const reducer = tokenBalanceReducer()
		// reducer.reduce(empty, particle: )
	})
})

/*
  func testSimpleBalance() throws {
        let reducer = TokenBalanceReferencesReducer()
        let balances = try reducer.reduceFromInitialState(upParticles: [transferrable(10)])
        
        let balance = balances[xrd]
        XCTAssertEqual(balance?.amount, 10)
    }
    
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
