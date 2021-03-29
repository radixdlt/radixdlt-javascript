import { Address } from '@radixdlt/account'
import { Denomination } from '@radixdlt/primitives'
import { Amount, zero } from '@radixdlt/primitives/src/amount'
import { ResourceIdentifier } from '../dist/dto/resourceIdentifier'
import { TransferTokensAction } from '../dist/actions/transferTokensAction'
import { IntendedTransferTokensInput } from '../dist/actions/_types'

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

	const input = <IntendedTransferTokensInput>{
		to: bob,
		from: alice,
		amount: amount,
		resourceIdentifier: resourceIdentifier,
	}

	it(`should have a 'recipient' equal to 'input.to'.`, () => {
		const tokenTransfer = TransferTokensAction.intended({
			...input,
			to: bob,
		})
		expect(tokenTransfer.to.equals(bob)).toBe(true)
	})

	it(`should have an 'amount' equal to 'input.amount'.`, () => {
		const tokenTransfer = TransferTokensAction.intended(input)
		expect(tokenTransfer.amount.equals(amount)).toBe(true)
	})

	it(`should have a 'sender' equal to 'input.from'.`, () => {
		const tokenTransfer = TransferTokensAction.intended({
			...input,
			from: alice,
		})
		expect(tokenTransfer.from.equals(alice)).toBe(true)
	})

	it('should generate a UUID if none is provided.', () => {
		const tokenTransfer = TransferTokensAction.intended(input)
		expect(tokenTransfer.uuid).toBeTruthy()
	})

	it('should be able to specify a UUID.', () => {
		const uuid = 'randomly generated string'
		const tokenTransfer = TransferTokensAction.intended({
			...input,
			uuid,
		})
		expect(tokenTransfer.uuid).toBe(uuid)
	})

	it('should be possible to transfer 0 tokens', () => {
		const tokenTransfer = TransferTokensAction.intended({
			...input,
			amount: zero,
		})

		expect(tokenTransfer.amount.equals(zero)).toBe(true)
	})
})
