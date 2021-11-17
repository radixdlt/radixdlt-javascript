/**
 * @group integration
 */

/* eslint-disable */
import { Radix } from '../../src/radix'
import { ResourceIdentifierT } from '@radixdlt/account'
import {
	firstValueFrom,
	interval,
	Subscription,
} from 'rxjs'
import { map, take, toArray } from 'rxjs/operators'
import {
	PendingTransaction,
	TransactionIdentifierT,
	TransactionStateSuccess,
	TransactionStatus,
} from '../../src/dto/_types'
import { Amount, AmountT, Network } from '@radixdlt/primitives'
import {
	TransactionTrackingEventType,
	KeystoreT,
} from '../../src'
import { AccountT } from '../../src'
import { keystoreForTest, makeWalletWithFunds } from '../util'

const fetch = require('node-fetch')

const network = Network.LOCALHOST

// local
const NODE_URL = 'http://localhost:8080'

// sandpit
// const NODE_URL = 'https://sandpitnet.radixdlt.com'

// RCNet
//const NODE_URL = 'https://54.73.253.49'

// release net
//const NODE_URL = 'https://18.168.73.103'

const loadKeystore = (): Promise<KeystoreT> =>
	Promise.resolve(keystoreForTest.keystore)

const requestFaucet = async (address: string) => {
	let request = {
		params: {
			address,
		},
	}

	await fetch(`${NODE_URL}/faucet/request`, {
		method: 'POST',
		body: JSON.stringify(request),
		headers: { 'Content-Type': 'application/json' },
	})
}

let subs: Subscription

let radix: ReturnType<typeof Radix.create>
let accounts: AccountT[]
let balances: any
let nativeTokenBalance: {
	tokenIdentifier: ResourceIdentifierT,
	amount: AmountT
}

describe('integration API tests', () => {
	beforeAll(async () => {
		radix = Radix.create()
		await radix
			.__withWallet(makeWalletWithFunds(network))
			.connect(`${NODE_URL}`)

		accounts = ((
			await firstValueFrom(radix.restoreLocalHDAccountsToIndex(2))
		) as any).all

		const account: AccountT = await firstValueFrom(radix.activeAccount)
		const api = await radix.api()
		balances = (await api.tokenBalancesForAddress({ address: account.address }))._unsafeUnwrap()

		nativeTokenBalance = balances.tokenBalances.find(
			(a: any) => {
				return a.tokenIdentifier.name.toLowerCase() === 'xrd'
			}
		) as any

		if (!nativeTokenBalance) throw Error('no XRD found')
	})

	beforeEach(() => {
		subs = new Subscription()
	})
	afterEach(() => {
		subs.unsubscribe()
	})
	/*
	it('can connect and is chainable', async () => {
		const radix = Radix.create()
		await radix.connect(`${NODE_URL}`)
		expect(radix).toBeDefined()
		expect(radix.ledger.nativeToken).toBeDefined()
		expect(radix.ledger.tokenBalancesForAddress).toBeDefined() // etc
	})

	it('emits node connection without wallet', async done => {
		const radix = Radix.create()
		await radix.connect(`${NODE_URL}`)

		subs.add(
			radix.__node.subscribe(
				node => {
					expect(node.url.host).toBe(new URL(NODE_URL).host)
					done()
				},
				error => done(error),
			),
		)
	})

	it('can switch networks', async done => {
		const radix = Radix.create()

		await radix
			.login(keystoreForTest.password, loadKeystore)
			.connect(`${NODE_URL}`)

		const address1 = await firstValueFrom(radix.activeAddress)
		expect(address1.network).toBeDefined()
		console.log(address1.toString())

		await radix.connect('https://mainnet.radixdlt.com')

		const address2 = await firstValueFrom(radix.activeAddress)
		expect(address2.network).toBeDefined()
		console.log(address2.toString())

		await radix.connect('https://stokenet.radixdlt.com')

		const address3 = await firstValueFrom(radix.activeAddress)
		expect(address3.network).toBeDefined()
		console.log(address3.toString())

		done()
	})

	it('returns native token without wallet', async done => {
		const radix = Radix.create()
		radix.connect(`${NODE_URL}`)

		subs.add(
			radix.ledger.nativeToken().subscribe(
				token => {
					expect(token.symbol).toBe('xrd')
					done()
				},
				error => done(error),
			),
		)
	})

	it('deriveNextSigningKey method on radix updates accounts', done => {
		const expected = [1, 2, 3]

		subs.add(
			radix.accounts
				.pipe(
					map(i => i.size()),
					take(expected.length),
					toArray(),
				)
				.subscribe(values => {
					expect(values).toStrictEqual(expected)
					done()
				}),
		)

		radix.deriveNextAccount({ alsoSwitchTo: true })
		radix.deriveNextAccount({ alsoSwitchTo: false })
	})

	it('deriveNextSigningKey alsoSwitchTo method on radix updates activeSigningKey', done => {
		const expected = [0, 1, 3]

		subs.add(
			radix.activeAccount
				.pipe(
					map(account => account.hdPath!.addressIndex.value()),
					take(expected.length),
					toArray(),
				)
				.subscribe(values => {
					expect(values).toStrictEqual(expected)
					done()
				}),
		)

		radix.deriveNextAccount({ alsoSwitchTo: true })
		radix.deriveNextAccount({ alsoSwitchTo: false })
		radix.deriveNextAccount({ alsoSwitchTo: true })
	})

	it('deriveNextSigningKey alsoSwitchTo method on radix updates activeAddress', done => {
		const expectedCount = 3

		subs.add(
			radix.activeAddress
				.pipe(take(expectedCount), toArray())
				.subscribe(values => {
					expect(values.length).toBe(expectedCount)
					done()
				}),
		)

		radix.deriveNextAccount({ alsoSwitchTo: true })
		radix.deriveNextAccount({ alsoSwitchTo: false })
		radix.deriveNextAccount({ alsoSwitchTo: true })
	})

	*/

	// 🟢
	it.only('should compare token balance before and after transfer', async done => {
		const amountToSend = Amount.fromUnsafe(
			`1${'0'.repeat(18)}`,
		)._unsafeUnwrap()

		let initialBalance: AmountT
		let balanceAfterTransfer: AmountT

		const api = await radix.api()

		const address = await firstValueFrom(radix.activeAddress)
		await requestFaucet(address.toString())


		const getXRDBalanceOrZero = async (): Promise<AmountT> => {
			const balances = (await radix.tokenBalances())._unsafeUnwrap()
			let xrdBalance = balances.find(
				(a: any) => {
					return a.tokenIdentifier.name.toLowerCase() === 'xrd'
				}
			)
			return xrdBalance !== undefined
				? xrdBalance.amount
				: Amount.fromUnsafe(0)._unsafeUnwrap()
		}

		initialBalance = await getXRDBalanceOrZero()

		const { completion } = (await radix
			.transferTokens(
				accounts[2].address,
				amountToSend,
				nativeTokenBalance.tokenIdentifier
			))._unsafeUnwrap()

		completion.subscribe(async txID => {
			const tx = (await api.lookupTransaction({ txID }))._unsafeUnwrap()

			balanceAfterTransfer = await getXRDBalanceOrZero()

			expect(
				initialBalance
					.sub(balanceAfterTransfer)
					.eq(amountToSend.add(tx.fee)),
			).toBe(true)
			done()
		})
	})

	// 🟢
	it('should increment transaction history with a new transaction after transfer', async done => {
		const pageSize = 100

		const fetchTxHistory = async (cursor: string): Promise<[string, number]> => {
			const txHistory = (await radix.transactionHistory(pageSize, cursor))._unsafeUnwrap()

			return [
				txHistory.cursor,
				txHistory.transactions.length,
			]
		}

		const getLastCursor = async () => {
			const txHistory = (await radix.transactionHistory(pageSize))._unsafeUnwrap()

			let cursor = txHistory.cursor
			let prevTxCount = 0
			let txCount = 0

			while (txCount >= prevTxCount) {
				prevTxCount = txCount;
				[cursor, txCount] = await fetchTxHistory(cursor)
			}

			return cursor
		}

		const cursor = await getLastCursor()

		const txHistory = (await radix.transactionHistory(pageSize, cursor))._unsafeUnwrap()

		const countBeforeTransfer = txHistory.transactions.length

		const { completion } = (await radix.transferTokens(
			accounts[2].address,
			Amount.fromUnsafe(1)._unsafeUnwrap(),
			nativeTokenBalance.tokenIdentifier,
		))._unsafeUnwrap()

		completion.subscribe(async tx => {
			const newTxHistory = (await radix.transactionHistory(pageSize, cursor))._unsafeUnwrap()

			expect(
				newTxHistory.transactions
					.length - 1,
			).toEqual(countBeforeTransfer)
			done()
		})
	})

	// 🟢
	it('should be able to get transaction history', async () => {
		const txID1 = await firstValueFrom((await
			radix.transferTokens(
				accounts[2].address,
				Amount.fromUnsafe(1)._unsafeUnwrap(),
				nativeTokenBalance.tokenIdentifier,
			))._unsafeUnwrap().completion)


		const txID2 = await firstValueFrom((await
			radix.transferTokens(
				accounts[2].address,
				Amount.fromUnsafe(1)._unsafeUnwrap(),
				nativeTokenBalance.tokenIdentifier,
			))._unsafeUnwrap().completion)

		const txHistory = (await radix.transactionHistory(2))._unsafeUnwrap()

		expect(txHistory.transactions[0].txID.equals(txID1))
		expect(txHistory.transactions[1].txID.equals(txID2))
	})

	// 🟢
	it('should handle transaction status updates', async done => {
		const expectedValues: TransactionStatus[] = [
			TransactionStatus.PENDING,
			TransactionStatus.CONFIRMED,
		]

		const txTracking = (await radix.transferTokens(
			accounts[2].address,
			Amount.fromUnsafe(1)._unsafeUnwrap(),
			nativeTokenBalance.tokenIdentifier
		))._unsafeUnwrap()

		txTracking.events.subscribe(event => {
			if (
				event.eventUpdateType === TransactionTrackingEventType.SUBMITTED
			) {
				const txID: TransactionIdentifierT = (event as TransactionStateSuccess<PendingTransaction>)
					.transactionState.txID

				subs.add(
					radix
						.transactionStatus(txID, interval(300))
						.pipe(
							map(({ status }) => status),
							take(expectedValues.length),
							toArray(),
						)
						.subscribe(values => {
							expect(values).toStrictEqual(expectedValues)
							done()
						}),
				)
			}
		})
	})

	// 🟢
	it('can lookup tx', async () => {
		const result = await radix.transferTokens(
			accounts[2].address,
			Amount.fromUnsafe(1)._unsafeUnwrap(),
			nativeTokenBalance.tokenIdentifier
		)

		const { completion } = result._unsafeUnwrap()

		const txID = await firstValueFrom(completion)

		const api = await radix.api()
		const tx = (await api.lookupTransaction({ txID }))._unsafeUnwrap()

		expect(txID.equals(tx.txID)).toBe(true)
		expect(tx.actions.length).toEqual(1)
	})

	// 🟢
	it('can lookup validator', async () => {
		const validator = (await radix.validators({ size: 1 }))._unsafeUnwrap().validators[0]

		const validatorFromLookup = (await radix.lookupValidator({
			validatorAddress: validator.address
		}))._unsafeUnwrap()

		expect(validatorFromLookup.address.equals(validator.address)).toBe(true)
	})


	// 🟢
	it('should get validators', async () => {
		const validators = (await radix.validators({ size: 1 }))._unsafeUnwrap()
		expect(validators.validators.length).toEqual(1)
	})

	// 🟢
	it('should be able to paginate validators', async () => {
		const validators = (await radix.validators({ size: 2 }))._unsafeUnwrap()

		const firstValidator = (await radix.validators({ size: 1 }))._unsafeUnwrap()

		const cursor = firstValidator.cursor

		expect(validators.validators[0].address.toString()).toEqual(
			firstValidator.validators[0].address.toString(),
		)

		const secondValidator = (await radix.validators({ size: 1, cursor }))._unsafeUnwrap()

		expect(validators.validators[1].address.toString()).toEqual(
			secondValidator.validators[0].address.toString(),
		)
	})

	// 🟢
	it('should get network transaction demand response', async () => {
		const api = await radix.api()
		const result = (await api.NetworkTransactionDemand())._unsafeUnwrap()

		expect(result.tps).toEqual(0)
	})

	// 🟢
	it('should get network transaction throughput response', async () => {
		const api = await radix.api()
		const result = (await api.NetworkTransactionThroughput())._unsafeUnwrap()

		expect(result.tps).toBeGreaterThan(0)
	})

	// 🟢
	it('can fetch stake positions', async done => {
		const stakeAmount = Amount.fromUnsafe(
			'100000000000000000000',
		)._unsafeUnwrap()

		const validators = (await radix.validators({ size: 1 }))._unsafeUnwrap()

		const positions = (await radix.stakingPositions())._unsafeUnwrap()

		const validator = validators.validators[0].address

		const stake = positions.find(position => position.validator.equals(validator))

		const initialAmountStaked = stake ? stake.amount : Amount.fromUnsafe(0)._unsafeUnwrap()

		const { completion } = (await radix.stakeTokens(validator, stakeAmount))._unsafeUnwrap()

		await firstValueFrom(completion)

		const positions2 = (await radix.stakingPositions())._unsafeUnwrap()

		const amountAfterStaking = positions2.find(position =>
			position.validator.equals(validator),
		)!.amount

		console.log(initialAmountStaked.toString())
		console.log(stakeAmount.toString())
		console.log(amountAfterStaking.toString())

		expect(
			amountAfterStaking.eq(
				initialAmountStaked.add(stakeAmount),
			),
		).toEqual(true)
		done()
	})

	it('can fetch unstake positions', async () => {
		const stakeAmount = Amount.fromUnsafe('100000000000000000000')._unsafeUnwrap()

		const validator = (await (radix.validators({ size: 1 })))._unsafeUnwrap().validators[0]

		await firstValueFrom((await radix.stakeTokens(validator.address, stakeAmount))._unsafeUnwrap().completion)

		await firstValueFrom((await radix.unstakeTokens(validator.address, stakeAmount))._unsafeUnwrap().completion)

		const positions = (await radix.unstakingPositions())._unsafeUnwrap()

		expect(positions[0].amount.eq(stakeAmount)).toBeTruthy()
	})

	// 🟢
	it('should be able to paginate validator result', async () => {
		const twoValidators = (await radix.validators({ size: 2 }))._unsafeUnwrap()

		const firstValidator = (await radix.validators({ size: 1 }))._unsafeUnwrap()
		const secondValidator = (await radix.validators({ size: 1, cursor: firstValidator.cursor }))._unsafeUnwrap()

		expect(firstValidator.validators[0].address.toString()).toEqual(
			twoValidators.validators[0].address.toString(),
		)

		expect(secondValidator.validators[0].address.toString()).toEqual(
			twoValidators.validators[1].address.toString(),
		)
	})
/*
	describe('make tx single transfer', () => {
		const tokenTransferInput: TransferTokensInput = {
			to: accounts[2].address,
			amount: 1,
			tokenIdentifier: nativeTokenBalance.token.rri,
		}

		let pollTXStatusTrigger: Observable<unknown>

		const transferTokens = (): TransferTokensOptions => ({
			transferInput: tokenTransferInput,
			userConfirmation: 'skip',
			pollTXStatusTrigger: pollTXStatusTrigger,
		})

		let subs: Subscription

		beforeEach(() => {
			subs = new Subscription()
			pollTXStatusTrigger = interval(500)
		})

		afterEach(() => {
			subs.unsubscribe()
		})

		it.skip('events emits expected values', done => {
			// can't see pending state because quick confirmation

			const expectedValues = [
				TransactionTrackingEventType.INITIATED,
				TransactionTrackingEventType.BUILT_FROM_INTENT,
				TransactionTrackingEventType.ASKED_FOR_CONFIRMATION,
				TransactionTrackingEventType.CONFIRMED,
				TransactionTrackingEventType.SIGNED,
				TransactionTrackingEventType.FINALIZED,
				TransactionTrackingEventType.SUBMITTED,
				TransactionTrackingEventType.UPDATE_OF_STATUS_OF_PENDING_TX,
				TransactionTrackingEventType.UPDATE_OF_STATUS_OF_PENDING_TX,
				TransactionTrackingEventType.COMPLETED,
			]

			subs.add(
				radix
					.transferTokens(transferTokens())
					.events.pipe(
						map(e => e.eventUpdateType),
						tap(x => console.log(x)),
						take(expectedValues.length),
						toArray(),
					)
					.subscribe({
						next: values => {
							expect(values).toStrictEqual(expectedValues)
							done()
						},
						error: e => {
							done(
								new Error(
									`Tx failed, even though we expected it to succeed, error: ${e.toString()}`,
								),
							)
						},
					}),
			)
		})

		it('automatic confirmation', done => {
			subs.add(
				radix.transferTokens(transferTokens()).completion.subscribe({
					next: _txID => { },
					complete: () => {
						done()
					},
					error: e => {
						done(
							new Error(
								`Tx failed, but expected to succeed. Error ${JSON.stringify(
									e,
									null,
									2,
								)}`,
							),
						)
					},
				}),
			)
		})

		it('manual confirmation', done => {
			//@ts-ignore
			let transaction
			//@ts-ignore
			let userHasBeenAskedToConfirmTX

			const confirmTransaction = () => {
				//@ts-ignore
				transaction.confirm()
			}

			const shouldShowConfirmation = () => {
				userHasBeenAskedToConfirmTX = true
				confirmTransaction()
			}

			const userConfirmation = new ReplaySubject<ManualUserConfirmTX>()

			const transactionTracking = radix.transferTokens({
				...transferTokens(),
				userConfirmation,
			})

			subs.add(
				userConfirmation.subscribe(txn => {
					//@ts-ignore
					transaction = txn
					shouldShowConfirmation()
				}),
			)

			subs.add(
				transactionTracking.completion.subscribe({
					next: _txID => {
						//@ts-ignore
						expect(userHasBeenAskedToConfirmTX).toBe(true)
						done()
					},
					error: e => {
						done(e)
					},
				}),
			)
		})
	})
	*/
})