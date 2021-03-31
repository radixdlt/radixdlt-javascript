import { TransactionIntentBuilder } from '../dist/dto/transactionIntentBuilder'
import { Amount, DenominationOutputFormat } from '@radixdlt/primitives'
import { alice, bob, carol, dan, erin, xrd } from './mockRadix'
import {
	IntendedTransferTokensAction,
	StakeTokensInput,
	TransferTokensInput,
} from '../dist/actions/_types'
import { AccountT, AddressT } from '@radixdlt/account'
import { ActionType } from '../src/actions/_types'
import { TransactionIntentBuilderT } from '../dist/dto/_types'
import { Observable, of, Subscription } from 'rxjs'

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

	const stakeS = (amount: number, validator: AddressT): StakeTokensInput => ({
		validator: validator,
		amount: Amount.fromUnsafe(amount)._unsafeUnwrap(),
	})

	const unstakeS = (
		amount: number,
		validator: AddressT,
	): StakeTokensInput => ({
		validator: validator,
		amount: Amount.fromUnsafe(amount)._unsafeUnwrap(),
	})

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

		txIntent.actions.forEach((t) => {
			expect(t.from.equals(alice)).toBe(true)
		})

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

	const testWithMessage = (
		builder: TransactionIntentBuilderT,
		msg: string,
		done: jest.DoneCallback,
	): Subscription => {
		const aliceAccount = <AccountT>{
			deriveAddress: (): Observable<AddressT> => of(alice),
		}
		return builder.buildAndEncrypt(aliceAccount).subscribe((txIntent) => {
			expect(txIntent.actions.length).toBe(1)

			const attatchedMessage = txIntent.message
			if (!attatchedMessage) {
				done(new Error('Expected message...'))
				return
			} else {
				const message = attatchedMessage!.msg
				const encryptionScheme = attatchedMessage!.encryptionScheme

				expect(message).toBe(
					`PLAIN_TEXT_BECAUSE_ENCRYPTION_IS_NOT_YET_INPLEMENTED___${msg}`,
				)

				// TODO update when message encryption is done.
				expect(encryptionScheme).toBe('PLAINTEXT')
				done()
			}
		})
	}

	it('can transfer then attach message', (done) => {
		const subs = new Subscription()
		const msg = 'Hey Bob, hope you are well'

		testWithMessage(
			TransactionIntentBuilder.create()
				.transferTokens(transfS(3, bob))
				.message(msg),
			msg,
			done,
		).add(subs)
	})

	it('can attach message then transfer', (done) => {
		const subs = new Subscription()
		const msg = 'Hey Bob, how are you?'

		testWithMessage(
			TransactionIntentBuilder.create()
				.message(msg)
				.transferTokens(transfS(3, bob)),
			msg,
			done,
		).add(subs)
	})

	it('can add transfer, stake, unstake then transfer', () => {
		const builder = TransactionIntentBuilder.create()
			.transferTokens(transfS(3, bob))
			.stakeTokens(stakeS(4, carol))
			.unstakeTokens(unstakeS(5, dan))
			.transferTokens(transfS(6, erin))

		const txIntent = builder.__syncBuildIgnoreMessage(alice)

		expect(txIntent.actions.length).toBe(4)
		expect(
			txIntent.actions.map((a) =>
				parseInt(
					a.amount.toString({
						denominationOutputFormat: DenominationOutputFormat.OMIT,
					}),
				),
			),
		).toStrictEqual([3, 4, 5, 6])

		const assertAddr = (index: number, expectedAddress: AddressT): void => {
			const action = txIntent.actions[index]
			const actualAddress =
				action.type === ActionType.TOKEN_TRANSFER
					? action.to
					: action.type === ActionType.UNSTAKE_TOKENS ||
					  action.type === ActionType.STAKE_TOKENS
					? action.validator
					: undefined
			if (!actualAddress) {
				throw new Error('Expected property TO or VALIDATOR')
			} else {
				expect(actualAddress.equals(expectedAddress)).toBe(true)
			}
		}

		const expectedAddresses = [bob, carol, dan, erin]

		txIntent.actions.forEach((t, i) => {
			expect(t.from.equals(alice)).toBe(true)
			assertAddr(i, expectedAddresses[i])
		})
	})
})
