import { addressFromBase58String } from '@radixdlt/account'
import { Denomination, zero } from '@radixdlt/primitives'
import { BurnTokensActionInput } from '../src/_types'
import { BurnTokensAction } from '../src/burnTokensAction'
import { Amount } from '@radixdlt/primitives/src/amount'
import { ResourceIdentifier } from '@radixdlt/atom'

describe('BurnTokensAction', () => {
	const alice = addressFromBase58String(
		'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
	)._unsafeUnwrap()

	const rri = ResourceIdentifier.fromAddressAndName({
		address: alice,
		name: 'FOOBAR',
	})
	const amount = Amount.fromUnsafe(6, Denomination.Atto)._unsafeUnwrap()

	const input = <BurnTokensActionInput>{
		burner: alice,
		amount: amount,
		resourceIdentifier: rri,
	}

	it('should be possible to burn 0 tokens', () => {
		const burnAction = BurnTokensAction.create({ ...input, amount: zero })
		expect(burnAction.amount.equals(zero)).toBe(true)
	})

	it(`should have a 'sender' equal to 'input.burner'.`, () => {
		const burnTokens = BurnTokensAction.create({
			...input,
			burner: alice,
		})
		expect(burnTokens.sender.equals(alice)).toBe(true)
	})

	it(`should have an 'amount' equal to 'input.amount'.`, () => {
		const burnTokens = BurnTokensAction.create(input)
		expect(burnTokens.amount.equals(amount)).toBe(true)
	})

	it('should generate a UUID if none is provided.', () => {
		const burnTokens = BurnTokensAction.create(input)
		expect(burnTokens.uuid).toBeTruthy()
	})

	it('should be able to specify a UUID.', () => {
		const uuid = 'randomly generated string'
		const burnTokens = BurnTokensAction.create({ ...input, uuid })
		expect(burnTokens.uuid).toBe(uuid)
	})
})
