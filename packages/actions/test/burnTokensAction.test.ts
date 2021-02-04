import { resourceIdentifierFromAddressAndName } from '@radixdlt/atom'
import { addressFromBase58String } from '@radixdlt/crypto'
import { amountFromUnsafe, Denomination, zero } from '@radixdlt/primitives'
import { BurnTokensActionInput } from '../src/_types'
import { burnTokensAction } from '../src/burnTokensAction'

describe('BurnTokensAction', () => {
	const alice = addressFromBase58String(
		'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
	)._unsafeUnwrap()

	const rri = resourceIdentifierFromAddressAndName({
		address: alice,
		name: 'FOOBAR',
	})
	const amount = amountFromUnsafe(6, Denomination.Atto)._unsafeUnwrap()

	const input = <BurnTokensActionInput>{
		burner: alice,
		amount: amount,
		resourceIdentifier: rri,
	}

	it('should not be possible to burn 0 tokens', () => {
		const burnActionResult = burnTokensAction({ ...input, amount: zero })

		burnActionResult.match(
			() => {
				throw Error('expected error, but got none')
			},
			(f) => expect(f.message).toBe(`Cannot burn a non positve amount.`),
		)
	})

	it(`should have a 'sender' equal to 'input.burner'.`, () => {
		const burnTokens = burnTokensAction({
			...input,
			burner: alice,
		})._unsafeUnwrap()
		expect(burnTokens.sender.equals(alice)).toBe(true)
	})

	it(`should have an 'amount' equal to 'input.amount'.`, () => {
		const burnTokens = burnTokensAction(input)._unsafeUnwrap()
		expect(burnTokens.amount.equals(amount)).toBe(true)
	})

	it('should generate a UUID if none is provided.', () => {
		const burnTokens = burnTokensAction(input)._unsafeUnwrap()
		expect(burnTokens.uuid).toBeTruthy()
	})

	it('should be able to specify a UUID.', () => {
		const uuid = 'randomly generated string'
		const burnTokens = burnTokensAction({ ...input, uuid })._unsafeUnwrap()
		expect(burnTokens.uuid).toBe(uuid)
	})
})
