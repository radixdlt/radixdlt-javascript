import { Amount, uint256Max } from '@radixdlt/primitives'
import {
	AccountT,
	Message,
	Action,
	createTransfer,
	buildTransaction,
	createStake,
} from '../src'
import {
	AccountAddress,
	AccountAddressT,
	ResourceIdentifier,
	ValidatorAddress,
	ValidatorAddressT,
} from '@radixdlt/account'
import { firstValueFrom, Subscription } from 'rxjs'
import { restoreDefaultLogLevel, log } from '@radixdlt/util'
import { createWallet } from './util'
import { ActionType } from '../src/actions'

const xrd = {
	name: 'Rad',
	rri: ResourceIdentifier.fromUnsafe('xrd_tr1qyf0x76s')._unsafeUnwrap(),
	symbol: 'XRD',
	description: 'The native coin of Radix network',
	granularity: Amount.fromUnsafe(1)._unsafeUnwrap(),
	isSupplyMutable: false,
	currentSupply: uint256Max,
	tokenInfoURL: new URL('https://www.radixdlt.com'),
	iconURL: new URL('https://www.image.radixdlt.com/'),
}

const carol = AccountAddress.fromUnsafe(
	'rdx1qsps28kdn4epn0c9ej2rcmwfz5a4jdhq2ez03x7h6jefvr4fnwnrtqqjaj7dt'
)._unsafeUnwrap({ withStackTrace: true })

describe('tx_intent_builder', () => {
	const validatorCarol: ValidatorAddressT = ValidatorAddress.fromUnsafe(
		'tv1qdqft0u899axwce955fkh9rundr5s2sgvhpp8wzfe3ty0rn0rgqj2x6y86p',
	)._unsafeUnwrap()

	const validatorDan: ValidatorAddressT = ValidatorAddress.fromUnsafe(
		'tv1qdqft0u899axwce955fkh9rundr5s2sgvhpp8wzfe3ty0rn0rgqj2x6y86p',
	)._unsafeUnwrap()

	const one = Amount.fromUnsafe(1)._unsafeUnwrap()
	const xrdRRI = xrd.rri

	const wallet = createWallet()

	let aliceAccount: AccountT
	let bobAccount: AccountT
	let alice: AccountAddressT
	let bob: AccountAddressT

	const subs = new Subscription()

	const plaintext = 'Hey Bob, how are you?'

	beforeAll(done => {
		subs.add(
			wallet.deriveNextLocalHDAccount().subscribe(
				(aliceId: AccountT) => {
					aliceAccount = aliceId
					alice = aliceId.address

					wallet.deriveNextLocalHDAccount().subscribe(
						(bobId: AccountT) => {
							bobAccount = bobId
							bob = bobId.address
							done()
						},
						e => done(e),
					)
				},
				e => done(e),
			),
		)
	})

	type SimpleTransf = { amount: number; to: AccountAddressT }
	const transfT = (input: SimpleTransf) => ({
		to: input.to.toPrimitive(),
		amount: Amount.fromUnsafe(input.amount)._unsafeUnwrap().toPrimitive(),
		rri: xrdRRI.toPrimitive(),
		from: alice.toPrimitive()
	})

	const transfS = (
		amount: number,
		to: AccountAddressT,
	) => transfT({ amount, to })

	const stakeS = (
		amount: number,
		validatorAddress: ValidatorAddressT,
	) => ({
		validator: validatorAddress.toPrimitive(),
		amount: Amount.fromUnsafe(amount)._unsafeUnwrap().toPrimitive(),
		from: alice.toPrimitive()
	})

	const unstakeS = (
		amount: number,
		validatorAddress: ValidatorAddressT,
	) => ({
		validator: validatorAddress.toPrimitive(),
		amount: Amount.fromUnsafe(amount)._unsafeUnwrap().toPrimitive(),
		from: alice.toPrimitive()
	})

	const validateOneToBob = async (...actions: Action[]) => {
		const tx = (await buildTransaction(...actions)(aliceAccount))._unsafeUnwrap()

		expect(tx.actions.length).toBe(1)
		const action0 = tx.actions[0] as Action.Transfer
		expect(action0.type).toEqual(ActionType.TRANSFER)
		const transfer0 = action0
		expect(transfer0.amount.eq(one)).toBe(true)
		expect(transfer0.from.equals(alice)).toBe(true)
		expect(transfer0.to.equals(bob)).toBe(true)
		expect(transfer0.rri.equals(xrdRRI)).toBe(true)
	}

	it('can add single transfer', async () => {
		const transfer = createTransfer(transfS(1, bob))._unsafeUnwrap()

		await validateOneToBob(transfer)
	})

	it('can add single transfer from unsafe inputs', async () => {
		const transfer = createTransfer({
			amount: '1',
			to: bob.toPrimitive(),
			rri: 'xrd_tr1qyf0x76s',
			from: alice.toPrimitive()
		})._unsafeUnwrap()

		await validateOneToBob(transfer)
	})

	it('can stake from unsafe inputs', async () => {
		const transfer = createStake({
			validator:
				'tv1qdqft0u899axwce955fkh9rundr5s2sgvhpp8wzfe3ty0rn0rgqj2x6y86p',
			amount: '1234567890',
			from: alice.toPrimitive()
		})._unsafeUnwrap()

		const tx = (await buildTransaction(transfer)(aliceAccount))._unsafeUnwrap()

		expect(tx.actions.length).toBe(1)
		const action0 = tx.actions[0]
		expect(action0.type).toBe(ActionType.STAKE)
		const stakeAction = action0 as Action.Stake
		expect(stakeAction.amount.toString()).toBe('1234567890')
	})

	it('can add multiple transfers', async () => {
		const expected: SimpleTransf[] = [
			{ amount: 1, to: carol },
			{ amount: 2, to: carol },
			{ amount: 3, to: carol },
		]

		const transfInputs = expected.map(transfT)

		const transfers = transfInputs.map(input => createTransfer(input)).map(result => result._unsafeUnwrap())

		const tx = (await buildTransaction(...transfers)(aliceAccount))._unsafeUnwrap()

		tx.actions.forEach(t => {
			expect(t.from.equals(alice)).toBe(true)
		})

		const transfers2 = tx.actions
			.map(a => a as Action.Transfer)
			.map(
				(t: Action.Transfer) => ({
					amount: parseInt(t.amount.toString()),
					to: t.to,
				}),
			)

		transfers2.forEach((t, i) => {
			expect(t.amount).toBe(expected[i].amount)
			expect(t.to.equals(expected[i].to)).toBe(true)
		})
	})

	const testWithMessage = async (
		tx: {
			actions: Action[],
			message?: Buffer
		},
		expectedPlaintext: string,
	) => {
		const encryptedMessage = tx.message!

		const aliceDecrypted = await firstValueFrom(aliceAccount.decrypt({
			encryptedMessage,
			publicKeyOfOtherParty: bob.publicKey,
		}))

		const bobDecrypted = await firstValueFrom(bobAccount.decrypt({
			encryptedMessage,
			publicKeyOfOtherParty: alice.publicKey,
		}));

		[aliceDecrypted, bobDecrypted].forEach(pt => {
			expect(pt).toBe(expectedPlaintext)
		})
	}

	it('can transfer then attach message', async () => {
		const transfer = createTransfer(transfS(3, bob))._unsafeUnwrap()

		await testWithMessage(
			(await buildTransaction(transfer)(aliceAccount, {
				plaintext,
				encrypt: true
			}))._unsafeUnwrap(),
			plaintext
		)
	})

	it('can have transfer and attach message and skip encryption', async () => {
		const tx = (await buildTransaction(
			createTransfer(transfS(3, bob))._unsafeUnwrap()
		)(
			aliceAccount,
			{
				plaintext,
				encrypt: false
			}
		))._unsafeUnwrap()

		expect(tx.actions.length).toBe(1)
		expect(Message.plaintextToString(tx.message!)).toBe(plaintext)
	})

	describe('failing scenarios', () => {
		beforeAll(() => {
			log.setLevel('silent')
			jest.spyOn(console, 'error').mockImplementation(() => { })
		})

		afterAll(() => {
			jest.clearAllMocks()
			restoreDefaultLogLevel()
		})

		it('an error is thrown when trying to encrypt message of a transaction with multiple recipients', async () => {
			const txResult = (await buildTransaction(
				createTransfer(transfS(1, bob))._unsafeUnwrap(),
				createTransfer(transfS(1, carol))._unsafeUnwrap()
			)(
				aliceAccount,
				{
					plaintext: 'No one will be able to see this because we will get a crash',
					encrypt: true
				}
			))

			expect(txResult.isErr()).toBe(true)
		})

		it('can encrypt message of a transaction with oneself as recipient', async () => {

			const plaintext = 'Hey Alice, it is me, Alice!'

			const tx = (await buildTransaction(
				createTransfer(transfS(1, alice))._unsafeUnwrap()
			)(
				aliceAccount,
				{
					plaintext,
					encrypt: true
				}
			))._unsafeUnwrap()

			const decryptedMessage = await firstValueFrom(aliceAccount.decrypt({
				encryptedMessage: tx.message!,
				publicKeyOfOtherParty: alice.publicKey,
			}))

			expect(decryptedMessage).toBe(plaintext)
		})
	})
})
