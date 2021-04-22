// import { Denomination } from '@radixdlt/primitives'
// import { Amount, zero } from '@radixdlt/primitives/src/amount'
// import { ResourceIdentifier, IntendedTransferTokens, TransferTokensInput, alice , bob } from '../src'
//
// describe.skip('TransferTokensActions', () => {
//
// 	const resourceIdentifier = ResourceIdentifier.create({
// 		hash: alice.publicKey.asData({ compressed: true }),
// 		name: 'FOOBAR',
// 	})._unsafeUnwrap({ withStackTrace: true })
// 	const amount = Amount.fromUnsafe(6, Denomination.Atto)._unsafeUnwrap({ withStackTrace: true })
//
// 	const input = <TransferTokensInput>{
// 		to: bob,
// 		amount: amount,
// 		tokenIdentifier: resourceIdentifier,
// 	}
//
// 	it(`should have a 'recipient' equal to 'input.to'.`, () => {
// 		const tokenTransfer = IntendedTransferTokens.create(
// 			input,
// 			alice,
// 		)._unsafeUnwrap({ withStackTrace: true })
// 		expect(tokenTransfer.to.equals(bob)).toBe(true)
// 	})
//
// 	it(`should have an 'amount' equal to 'input.amount'.`, () => {
// 		const tokenTransfer = IntendedTransferTokens.create(
// 			input,
// 			alice,
// 		)._unsafeUnwrap({ withStackTrace: true })
// 		expect(tokenTransfer.amount.equals(amount)).toBe(true)
// 	})
//
// 	it(`should have a 'sender' equal to 'input.from'.`, () => {
// 		const tokenTransfer = IntendedTransferTokens.create(
// 			input,
// 			alice,
// 		)._unsafeUnwrap({ withStackTrace: true })
// 		expect(tokenTransfer.from.equals(alice)).toBe(true)
// 	})
//
// 	it(`should have a 'uuid'`, () => {
// 		const tokenTransfer = IntendedTransferTokens.create(
// 			input,
// 			alice,
// 		)._unsafeUnwrap({ withStackTrace: true })
// 		expect(tokenTransfer.uuid).toBeDefined()
// 	})
//
// 	it('should be possible to transfer 0 tokens', () => {
// 		const tokenTransfer = IntendedTransferTokens.create(
// 			{ ...input, amount: zero },
// 			alice,
// 		)._unsafeUnwrap({ withStackTrace: true })
//
// 		expect(tokenTransfer.amount.equals(zero)).toBe(true)
// 	})
// })

describe('empty', () => {
	it('needs tests', () => {

	})
})