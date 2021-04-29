import { Amount } from '@radixdlt/primitives'
import {
	ActionType,
	carol,
	erin,
	IdentityManagerT,
	IdentityT,
	IntendedStakeTokensAction,
	IntendedTransferTokensAction,
	StakeTokensInput,
	TransactionIntentBuilder,
	TransactionIntentBuilderT,
	TransferTokensInput,
	xrd,
} from '../src'
import {
	AccountAddressT,
	isAccountAddress,
	isValidatorAddress,
	Mnemonic,
	NetworkT,
	ValidatorAddress,
	ValidatorAddressT,
	Wallet,
} from '@radixdlt/account'
import { merge, of, Subscription } from 'rxjs'

import { map, mergeMap, take, toArray } from 'rxjs/operators'
import { restoreDefaultLogLevel, log } from '@radixdlt/util'
import { IdentityManager } from '../src/identityManager'
import { createIM } from './util'

describe('tx_intent_builder', () => {
	const validatorCarol: ValidatorAddressT = ValidatorAddress.fromUnsafe(
		'vb1qgfqnj34dn7qp9wvf4l6rhw6hu3l82rcqh3rjtk080t75t888u98wkh3gjq',
	)._unsafeUnwrap()

	const validatorDan: ValidatorAddressT = ValidatorAddress.fromUnsafe(
		'vb1q2hjzctnunty0g2e39qpg7mawkmv4k4ep733p7khxdzdjfkmlfhp2phu80q',
	)._unsafeUnwrap()

	const one = Amount.fromUnsafe(1)._unsafeUnwrap()
	const xrdRRI = xrd.rri

	const identityManager = createIM()

	let aliceIdentity: IdentityT // = wallet.deriveNext()
	let bobIdentity: IdentityT // = wallet.deriveNext()
	let alice: AccountAddressT
	let bob: AccountAddressT

	const subs = new Subscription()

	const plaintext = 'Hey Bob, how are you?'

	beforeAll((done) => {
		subs.add(
			identityManager.deriveNextIdentity().subscribe(
				(aliceId: IdentityT) => {
					aliceIdentity = aliceId
					alice = aliceId.accountAddress

					identityManager.deriveNextIdentity().subscribe(
						(bobId: IdentityT) => {
							bobIdentity = bobId
							bob = bobId.accountAddress
							done()
						},
						(e) => done(e),
					)
				},
				(e) => done(e),
			),
		)
	})

	type SimpleTransf = { amount: number; to: AccountAddressT }
	const transfT = (input: SimpleTransf): TransferTokensInput => ({
		to: input.to,
		amount: Amount.fromUnsafe(input.amount)._unsafeUnwrap(),
		tokenIdentifier: xrdRRI,
	})

	const transfS = (
		amount: number,
		to: AccountAddressT,
	): TransferTokensInput => transfT({ amount, to })

	const stakeS = (
		amount: number,
		validatorAddress: ValidatorAddressT,
	): StakeTokensInput => ({
		validator: validatorAddress,
		amount: Amount.fromUnsafe(amount)._unsafeUnwrap(),
	})

	const unstakeS = (
		amount: number,
		validatorAddress: ValidatorAddressT,
	): StakeTokensInput => ({
		validator: validatorAddress,
		amount: Amount.fromUnsafe(amount)._unsafeUnwrap(),
	})

	const validateOneToBob = (builder: TransactionIntentBuilderT): void => {
		const txIntent = builder
			.__syncBuildDoNotEncryptMessageIfAny(alice)
			._unsafeUnwrap()

		expect(txIntent.actions.length).toBe(1)
		const action0 = txIntent.actions[0]
		expect(action0.type).toEqual(ActionType.TOKEN_TRANSFER)
		const transfer0 = action0 as IntendedTransferTokensAction
		expect(transfer0.amount.eq(one)).toBe(true)
		expect(transfer0.from.equals(alice)).toBe(true)
		expect(transfer0.to.equals(bob)).toBe(true)
		expect(transfer0.rri.equals(xrdRRI)).toBe(true)
	}

	it('can add single transfer', () => {
		const builder = TransactionIntentBuilder.create().transferTokens(
			transfS(1, bob),
		)

		validateOneToBob(builder)
	})

	it('can add single transfer from unsafe inputs', () => {
		const builder = TransactionIntentBuilder.create().transferTokens({
			// unsafe inputs
			amount: 1,
			to: bob.toString(),
			tokenIdentifier: 'xrd_rb1qya85pwq',
		})

		validateOneToBob(builder)
	})

	it('can stake from unsafe inputs', () => {
		const builder = TransactionIntentBuilder.create().stakeTokens({
			validator:
				'vb1qv8yvu0266mj996nqdk5skj7r88udjx4wpsagg7x64fsggs0s9hz5f8wtld',
			amount: 1234567890,
		})

		const txIntent = builder
			.__syncBuildDoNotEncryptMessageIfAny(alice)
			._unsafeUnwrap()
		expect(txIntent.actions.length).toBe(1)
		const action0 = txIntent.actions[0]
		expect(action0.type).toBe(ActionType.STAKE_TOKENS)
		const stakeAction = action0 as IntendedStakeTokensAction
		expect(stakeAction.amount.toString()).toBe('1234567890')
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

		const txIntent = builder
			.__syncBuildDoNotEncryptMessageIfAny(alice)
			._unsafeUnwrap()

		txIntent.actions.forEach((t) => {
			expect(t.from.equals(alice)).toBe(true)
		})

		const transfers = txIntent.actions
			.map((a) => a as IntendedTransferTokensAction)
			.map(
				(t: IntendedTransferTokensAction): SimpleTransf => ({
					amount: parseInt(t.amount.toString()),
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
		expectedPlaintext: string,
		done: jest.DoneCallback,
	): Subscription => {
		return builder
			.build({
				spendingSender: of(alice),
				encryptMessageIfAnyWithIdentity: of(aliceIdentity),
			})
			.pipe(
				mergeMap((txIntent) => {
					const encryptedMessage = txIntent.message!

					const aliceDecrypted$ = aliceIdentity.decrypt({
						encryptedMessage,
						publicKeyOfOtherParty: bob.publicKey,
					})

					const bobDecrypted$ = bobIdentity.decrypt({
						encryptedMessage,
						publicKeyOfOtherParty: alice.publicKey,
					})

					return merge(aliceDecrypted$, bobDecrypted$)
				}),
				take(2),
				toArray(),
			)
			.subscribe(
				(plaintexts: string[]) => {
					plaintexts.forEach((pt) => {
						expect(pt).toBe(expectedPlaintext)
					})
					done()
				},
				(error) => {
					done(error)
				},
			)
	}
	it('can transfer then attach message', (done) => {
		const subs = new Subscription()

		subs.add(
			testWithMessage(
				TransactionIntentBuilder.create()
					.transferTokens(transfS(3, bob))
					.message({ plaintext, encrypt: true }),
				plaintext,
				done,
			),
		)
	})

	it('can attach message then transfer', (done) => {
		const subs = new Subscription()

		subs.add(
			testWithMessage(
				TransactionIntentBuilder.create()
					.message({ plaintext, encrypt: true })
					.transferTokens(transfS(3, bob)),
				plaintext,
				done,
			),
		)
	})

	it('throws errors if no action was specified', () => {
		TransactionIntentBuilder.create()
			.__syncBuildDoNotEncryptMessageIfAny(alice)
			.match(
				() => {
					throw new Error('expected error but got none')
				},
				(e) => {
					expect(e.message).toBe(
						'A transaction intent must contain at least one of the following actions: TransferToken, StakeTokens or UnstakeTokens',
					)
				},
			)
	})

	it('can have transfer and attach message and skip encryption', (done) => {
		const subs = new Subscription()

		subs.add(
			TransactionIntentBuilder.create()
				.transferTokens(transfS(3, bob))
				.message({ plaintext, encrypt: false })
				.build({
					skipEncryptionOfMessageIfAny: { spendingSender: of(alice) },
				})
				.subscribe((txIntent) => {
					expect(txIntent.actions.length).toBe(1)

					const attatchedMessage = txIntent.message
					if (!attatchedMessage) {
						done(new Error('Expected message...'))
						return
					} else {
						expect(attatchedMessage.toString('utf8')).toBe(
							plaintext,
						)
						done()
					}
				}),
		)
	})

	it('can add transfer, stake, unstake then transfer', () => {
		const builder = TransactionIntentBuilder.create()
			.transferTokens(transfS(3, bob))
			.stakeTokens(stakeS(4, validatorCarol))
			.unstakeTokens(unstakeS(5, validatorDan))
			.transferTokens(transfS(6, erin))

		const txIntent = builder
			.__syncBuildDoNotEncryptMessageIfAny(alice)
			._unsafeUnwrap()

		expect(txIntent.actions.length).toBe(4)
		expect(
			txIntent.actions.map((a) => parseInt(a.amount.toString())),
		).toStrictEqual([3, 4, 5, 6])

		type AnyAddress = ValidatorAddressT | AccountAddressT

		const assertAddr = (
			index: number,
			expectedAddress: AnyAddress,
		): void => {
			const action = txIntent.actions[index]
			const actualAddressMaybe: AnyAddress | undefined =
				action.type === ActionType.TOKEN_TRANSFER
					? action.to
					: action.type === ActionType.UNSTAKE_TOKENS ||
					  action.type === ActionType.STAKE_TOKENS
					? action.validator
					: undefined
			if (!actualAddressMaybe) {
				throw new Error('Expected property TO or VALIDATOR')
			} else {
				const actualAddress: AnyAddress = actualAddressMaybe
				if (
					isAccountAddress(expectedAddress) &&
					isAccountAddress(actualAddress)
				) {
					expect(actualAddress.equals(expectedAddress)).toBe(true)
				} else if (
					isValidatorAddress(expectedAddress) &&
					isValidatorAddress(actualAddress)
				) {
					expect(actualAddress.equals(expectedAddress)).toBe(true)
				} else {
					throw new Error('address type mismatch')
				}
			}
		}

		const expectedAddresses: AnyAddress[] = [
			bob,
			validatorCarol,
			validatorDan,
			erin,
		]

		txIntent.actions.forEach((t, i) => {
			expect(t.from.equals(alice)).toBe(true)
			assertAddr(i, expectedAddresses[i])
		})
	})

	describe('failing scenarios', () => {
		beforeAll(() => {
			log.setLevel('silent')
			jest.spyOn(console, 'error').mockImplementation(() => {})
		})

		afterAll(() => {
			jest.clearAllMocks()
			restoreDefaultLogLevel()
		})

		it('an error is thrown when specifying encryption for message but building intent without encrypting account', (done) => {
			const subs = new Subscription()

			const builder = TransactionIntentBuilder.create()
				.transferTokens(transfS(1, bob))
				.message({
					plaintext:
						'No one will be able to see this because we will get a crash',
					encrypt: true,
				})

			builder
				.build({
					skipEncryptionOfMessageIfAny: { spendingSender: of(alice) },
				})
				.subscribe({
					next: (_) => {
						done(new Error('Expected error'))
					},
					error: (error: Error) => {
						expect(error.message).toBe(
							'Message in transaction specifies it should be encrypted, but input to TransactionIntentBuilder build method specifies that it (the builder) should not encrypt the message, and does not provide any account with which we can perform encryption.',
						)
						done()
					},
				})
				.add(subs)
		})

		it('an error is thrown when specifying plaintext for message but building intent with encrypting account', (done) => {
			const subs = new Subscription()

			const builder = TransactionIntentBuilder.create()
				.transferTokens(transfS(1, bob))
				.message({
					plaintext:
						'No one will be able to see this because we will get a crash',
					encrypt: false,
				})

			builder
				.build({ encryptMessageIfAnyWithIdentity: of(aliceIdentity) })
				.subscribe({
					next: (_) => {
						done(new Error('Expected error'))
					},
					error: (error: Error) => {
						expect(error.message).toBe(
							'You are trying to encrypt a message which was specified not to be encrypted.',
						)
						done()
					},
				})
				.add(subs)
		})

		it('an error is thrown when trying to encrypt message of a transaction with multiple recipients', (done) => {
			const subs = new Subscription()

			const builder = TransactionIntentBuilder.create()
				.transferTokens(transfS(1, bob))
				.transferTokens(transfS(1, carol))
				.message({
					plaintext:
						'No one will be able to see this because we will get a crash',
					encrypt: true,
				})

			builder
				.build({ encryptMessageIfAnyWithIdentity: of(aliceIdentity) })
				.subscribe({
					next: (_) => {
						done(new Error('Expected error'))
					},
					error: (error: Error) => {
						expect(error.message).toBe(
							'Cannot encrypt/decrypt message for a transaction containing more than one recipient addresses.',
						)
						done()
					},
				})
				.add(subs)
		})
	})

	it('can encrypt message of a transaction with oneself as recipient', (done) => {
		const subs = new Subscription()

		const plaintext = 'Hey Alice, it is me, Alice!'

		const builder = TransactionIntentBuilder.create()
			.transferTokens(transfS(1, alice))
			.message({ plaintext, encrypt: true })

		builder
			.build({ encryptMessageIfAnyWithIdentity: of(aliceIdentity) })
			.pipe(
				mergeMap(({ message }) => {
					return aliceIdentity.decrypt({
						encryptedMessage: message!,
						publicKeyOfOtherParty: alice.publicKey,
					})
				}),
			)
			.subscribe({
				next: (decryptedMessage) => {
					expect(decryptedMessage).toBe(plaintext)
					done()
				},
				error: (error: Error) => {
					done(error)
				},
			})
			.add(subs)
	})
})
