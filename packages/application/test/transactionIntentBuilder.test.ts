import { TransactionIntentBuilder } from '../dist/dto/transactionIntentBuilder'
import { Amount, DenominationOutputFormat } from '@radixdlt/primitives'
import { alice, bob, carol, xrd } from './mockRadix'
import {
	IntendedTransferTokensAction,
	TransferTokensInput,
} from '../dist/actions/_types'
import { AddressT } from '@radixdlt/account'
import { ActionType } from '../src/actions/_types'

describe('tx intent builder', () => {
	const one = Amount.fromUnsafe(1)._unsafeUnwrap()
	const xrdRRI = xrd.rri

	type SimpleTransf = { amount: number; to: AddressT }
	const transfT = (input: SimpleTransf): TransferTokensInput => ({
		to: input.to,
		amount: Amount.fromUnsafe(input.amount)._unsafeUnwrap(),
		tokenIdentifier: xrdRRI,
	})
	const transfS = (amount: number, to: AddressT): TransferTokensInput =>
		transfT({ amount, to })

	it('can add single transfer', () => {
		const builder = TransactionIntentBuilder.create().transferTokens(
			transfS(1, bob),
		)

		const txIntent = builder.__syncBuildIgnoreMessage(alice)

		expect(txIntent.actions.length).toBe(1)
		const action0 = txIntent.actions[0]
		expect(action0.type).toEqual(ActionType.TOKEN_TRANSFER)
		const transfer0 = action0 as IntendedTransferTokensAction
		expect(transfer0.amount.equals(one)).toBe(true)
		expect(transfer0.from.equals(alice)).toBe(true)
		expect(transfer0.to.equals(bob)).toBe(true)
		expect(transfer0.tokenIdentifier.equals(xrdRRI)).toBe(true)
	})

	it('can add multiple transfers', () => {
		const expected: SimpleTransf[] = [
			{ amount: 1, to: bob },
			{ amount: 2, to: carol },
			{ amount: 3, to: carol },
		]

		const transfInputs = expected.map(transfT)

		const builder = TransactionIntentBuilder.create()
			.transferTokens(transfInputs[0])
			.transferTokens(transfInputs[1])
			.transferTokens(transfInputs[2])

		const txIntent = builder.__syncBuildIgnoreMessage(alice)

		const transfers = txIntent.actions
			.map((a) => a as IntendedTransferTokensAction)
			.map(
				(t: IntendedTransferTokensAction): SimpleTransf => ({
					amount: parseInt(
						t.amount.toString({
							denominationOutputFormat:
								DenominationOutputFormat.OMIT,
						}),
					),
					to: t.to,
				}),
			)

		transfers.forEach((t, i) => {
			expect(t.amount).toBe(expected[i].amount)
			expect(t.to.equals(expected[i].to)).toBe(true)
		})
	})
})
