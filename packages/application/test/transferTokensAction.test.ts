import { Address } from '@radixdlt/account'
import { Denomination } from '@radixdlt/primitives'
import { Amount, zero } from '@radixdlt/primitives/src/amount'
import { ResourceIdentifier } from '../src/dto/resourceIdentifier'
import { TransferTokensInput } from '../dist/actions/_types'
import { IntendedTransferTokens } from '../dist/actions/intendedTransferTokensAction'

describe('TransferTokensActions', () => {
	const alice = Address.fromBase58String(
		'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
	)._unsafeUnwrap()

	const bob = Address.fromBase58String(
		'9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
	)._unsafeUnwrap()

	const resourceIdentifier = ResourceIdentifier.fromAddressAndName({
		address: alice,
		name: 'FOOBAR',
	})
	const amount = Amount.fromUnsafe(6, Denomination.Atto)._unsafeUnwrap()

	const input = <TransferTokensInput>{
		to: bob,
		amount: amount,
		tokenIdentifier: resourceIdentifier,
	}

	it(`should have a 'recipient' equal to 'input.to'.`, () => {
		const tokenTransfer = IntendedTransferTokens.create(input, alice)
		expect(tokenTransfer.to.equals(bob)).toBe(true)
	})

	it(`should have an 'amount' equal to 'input.amount'.`, () => {
		const tokenTransfer = IntendedTransferTokens.create(input, alice)
		expect(tokenTransfer.amount.equals(amount)).toBe(true)
	})

	it(`should have a 'sender' equal to 'input.from'.`, () => {
		const tokenTransfer = IntendedTransferTokens.create(input, alice)
		expect(tokenTransfer.from.equals(alice)).toBe(true)
	})

	it(`should have a 'uuid'`, () => {
		const tokenTransfer = IntendedTransferTokens.create(input, alice)
		expect(tokenTransfer.uuid).toBeDefined()
	})

	it('should be possible to transfer 0 tokens', () => {
		const tokenTransfer = IntendedTransferTokens.create(
			{ ...input, amount: zero },
			alice,
		)

		expect(tokenTransfer.amount.equals(zero)).toBe(true)
	})
})
