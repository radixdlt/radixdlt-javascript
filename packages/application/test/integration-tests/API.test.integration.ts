/**
 * @group integration
 */

/* eslint-disable */
import { Radix } from '../../src/radix'
import { Address, ValidatorAddress } from '@radixdlt/account'
import {
	interval,
	Observable,
	of,
	ReplaySubject,
	Subject,
	Subscription,
	timer,
} from 'rxjs'
import { map, take, toArray } from 'rxjs/operators'
import { ManualUserConfirmTX } from '../../src/_types'
import { bob } from '../../src/mockRadix'
import { NodeT } from '../../src/api/_types'
import { TransactionIdentifierT, TransactionStatus } from '../../src/dto/_types'
import { Amount, AmountT } from '@radixdlt/primitives'
import { TransactionIntentBuilder } from '../../src/dto/transactionIntentBuilder'
import { TransactionTrackingEventType } from '../../src/dto/_types'
import { TransferTokensInput } from '../../src/actions/_types'
import { TransferTokensOptions } from '../../src/_types'
import { makeWalletWithFunds } from '../../../account/test/utils'
const fetch = require('node-fetch')

//const NODE_URL = 'http://localhost:8080'
const NODE_URL = 'https://54.73.253.49'

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

const dummyNode = (urlString: string): Observable<NodeT> =>
	of({
		url: new URL(urlString),
	})

describe('integration API tests', () => {
	const subs = new Subscription()

	afterAll(() => {
		subs.unsubscribe()
	})

	it('can connect and is chainable', () => {
		const radix = Radix.create().connect(`${NODE_URL}/rpc`)
		expect(radix).toBeDefined()
		expect(radix.ledger.nativeToken).toBeDefined()
		expect(radix.ledger.tokenBalancesForAddress).toBeDefined() // etc
	})

	it('emits node connection without wallet', async (done) => {
		const radix = Radix.create().connect(`${NODE_URL}/rpc`)

		radix.__node
			.subscribe(
				(node) => {
					expect(node.url.host).toBe(new URL(NODE_URL).host)
					done()
				},
				(error) => done(error),
			)
			.add(subs)
	})

	it('provides network for wallets', async (done) => {
		const radix = Radix.create()
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		radix.activeAddress
			.subscribe(
				(address) => {
					expect(address.network).toBeDefined()
					done()
				},
				(error) => done(error),
			)
			.add(subs)
	})

	it('returns native token without wallet', async (done) => {
		const radix = Radix.create()
		radix.connect(`${NODE_URL}/rpc`)

		radix.ledger
			.nativeToken()
			.subscribe(
				(token) => {
					expect(token.symbol).toBe('XRD')
					done()
				},
				(error) => done(error),
			)
			.add(subs)
	})

	it('deriveNextAccount method on radix updates accounts', (done) => {
		const radix = Radix.create()
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		const expected = [1, 2, 3]

		radix.accounts
			.pipe(
				map((a) => a.size),
				take(expected.length),
				toArray(),
			)
			.subscribe((values) => {
				expect(values).toStrictEqual(expected)
				done()
			})
			.add(subs)

		radix.deriveNextAccount({ alsoSwitchTo: true })
		radix.deriveNextAccount({ alsoSwitchTo: false })
	})

	it('deriveNextAccount alsoSwitchTo method on radix updates activeAccount', (done) => {
		const radix = Radix.create()
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		const expected = [0, 1, 3]

		radix.activeAccount
			.pipe(
				map((a) => a.hdPath.addressIndex.value()),
				take(expected.length),
				toArray(),
			)
			.subscribe((values) => {
				expect(values).toStrictEqual(expected)
				done()
			})
			.add(subs)

		radix.deriveNextAccount({ alsoSwitchTo: true })
		radix.deriveNextAccount({ alsoSwitchTo: false })
		radix.deriveNextAccount({ alsoSwitchTo: true })
	})

	it('deriveNextAccount alsoSwitchTo method on radix updates activeAddress', (done) => {
		const radix = Radix.create()
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		const expectedCount = 3

		radix.activeAddress
			.pipe(take(expectedCount), toArray())
			.subscribe((values) => {
				expect(values.length).toBe(expectedCount)
				done()
			})
			.add(subs)

		radix.deriveNextAccount({ alsoSwitchTo: true })
		radix.deriveNextAccount({ alsoSwitchTo: false })
		radix.deriveNextAccount({ alsoSwitchTo: true })
	})

	it('should compare token balance before and after transfer', (done) => {
		const radix = Radix.create()
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		const getTokenBalanceSubject = new Subject<number>()

		radix.withTokenBalanceFetchTrigger(getTokenBalanceSubject)

		getTokenBalanceSubject.next(1)

		let transferDone = false
		const amountToSend = Amount.fromUnsafe(1)._unsafeUnwrap()

		let initialBalance: AmountT
		let balanceAfterTransfer: AmountT
		let fee: AmountT

		radix.tokenBalances
			.subscribe((balance) => {
				if (transferDone) {
					balanceAfterTransfer = balance.tokenBalances[0].amount

					expect(
						initialBalance
							.subtracting(balanceAfterTransfer)
							._unsafeUnwrap()
							.equals(amountToSend.adding(fee)._unsafeUnwrap()),
					).toEqual(true)
					done()
				} else {
					initialBalance = balance.tokenBalances[0].amount
				}
			})
			.add(subs)

		radix
			.transferTokens({
				transferInput: {
					to: bob,
					amount: amountToSend,
					tokenIdentifier: `//XRD`,
				},
				userConfirmation: 'skip',
				pollTXStatusTrigger: timer(500),
			})
			.completion.subscribe((txID) => {
				transferDone = true
				radix.ledger
					.lookupTransaction(txID)
					.subscribe((tx) => {
						fee = tx.fee
						getTokenBalanceSubject.next(1)
					})
					.add(subs)
			})
			.add(subs)
	})

	it('should increment transaction history with a new transaction after transfer', (done) => {
		const radix = Radix.create()
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		radix
			.transactionHistory({
				size: 1000000,
			})
			.subscribe((txHistory) => {
				const countBeforeTransfer = txHistory.transactions.length

				radix
					.transferTokens({
						transferInput: {
							to: bob,
							amount: 1,
							tokenIdentifier: `//XRD`,
						},
						userConfirmation: 'skip',
						pollTXStatusTrigger: timer(500),
					})
					.completion.subscribe((tx) => {
						radix
							.transactionHistory({
								size: 1000000,
							})
							.subscribe((newTxHistory) => {
								expect(
									newTxHistory.transactions.length - 1,
								).toEqual(countBeforeTransfer)
								done()
							})
							.add(subs)
					})
					.add(subs)
			})
			.add(subs)
	})

	it.only('should be able to paginate transaction history', (done) => {
		const radix = Radix.create()
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		radix
			.transferTokens({
				transferInput: {
					to: bob,
					amount: 1,
					tokenIdentifier: `//XRD`,
				},
				userConfirmation: 'skip',
			})
			.completion.subscribe((txID1) => {
				radix
					.transferTokens({
						transferInput: {
							to: bob,
							amount: 1,
							tokenIdentifier: `//XRD`,
						},
						userConfirmation: 'skip',
					})
					.completion.subscribe((txID2) => {
						radix
							.transactionHistory({
								size: 2,
							})
							.subscribe((txHistory) => {
								radix
									.transactionHistory({
										size: 1,
									})
									.subscribe((firstTxHistory) => {
										const cursor = firstTxHistory.cursor

										expect(
											txHistory.transactions[0].txID.toString(),
										).toEqual(
											firstTxHistory.transactions[0].txID.toString(),
										)

										radix
											.transactionHistory({
												size: 1,
												cursor,
											})
											.subscribe((secondTxHistory) => {
												expect(
													txHistory.transactions[1].txID.toString(),
												).toEqual(
													secondTxHistory.transactions[0].txID.toString(),
												)
												done()
											})
											.add(subs)
									})
									.add(subs)
							})
							.add(subs)
					})
			})
	})

	it('should handle transaction status updates', (done) => {
		const radix = Radix.create()
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		const expectedValues: TransactionStatus[] = [
			TransactionStatus.PENDING,
			TransactionStatus.CONFIRMED,
		]

		radix.activeAddress.subscribe(async (address) => {
			const txTracking = radix.transferTokens({
				transferInput: {
					to: bob,
					amount: 1,
					tokenIdentifier: `//XRD`,
				},
				userConfirmation: 'skip',
				pollTXStatusTrigger: interval(200),
			})

			radix.activeAddress.subscribe((address) => {
				txTracking.events.subscribe((event) => {
					if (
						event.eventUpdateType ===
						TransactionTrackingEventType.SUBMITTED
					) {
						const txID: TransactionIdentifierT = (event as any)
							.transactionState.txID

						radix
							.transactionStatus(txID, interval(300))
							.pipe(
								map(({ status }) => status),
								take(expectedValues.length),
								toArray(),
							)
							.subscribe((values) => {
								expect(values).toStrictEqual(expectedValues)
								done()
							})
							.add(subs)
					}
				})
			})
		})
	})

	it('can lookup tx', async (done) => {
		const radix = Radix.create()
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		const txTracking = radix.transferTokens({
			transferInput: {
				to: bob,
				amount: 1,
				tokenIdentifier: `//XRD`,
			},
			userConfirmation: 'skip',
			pollTXStatusTrigger: timer(500),
		})

		txTracking.events.subscribe((event) => {
			if (
				event.eventUpdateType === TransactionTrackingEventType.SUBMITTED
			) {
				const txID: TransactionIdentifierT = (event as any)
					.transactionState.txID

				setTimeout(() => {
					radix.ledger.lookupTransaction(txID).subscribe((tx) => {
						expect(txID.equals(txID)).toBe(true)
						expect(tx.actions.length).toBeGreaterThan(0)
						done()
					})
				}, 1000)
			}
		})
	})

	it.skip('can lookup validator', (done) => {
		// not implemented in core
		const radix = Radix.create()
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		radix.ledger
			.validators({
				size: 1,
			})
			.subscribe((validators) => {
				const validator = validators.validators[0]

				radix.ledger
					.lookupValidator(validator.address)
					.subscribe((validatorFromLookup) => {
						expect(
							validatorFromLookup.address.equals(
								validator.address,
							),
						).toBe(true)
						done()
					})
			})
			.add(subs)
	})

	it.skip('should get validators', (done) => {
		// not implemented in core
		const radix = Radix.create()
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		radix.ledger
			.validators({
				size: 10,
				cursor: '',
			})
			.subscribe((validators) => {
				expect(validators.validators.length).toEqual(10)
				done()
			})
			.add(subs)
	})

	it('should get build transaction response', (done) => {
		const radix = Radix.create()
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		TransactionIntentBuilder.create()
			.transferTokens({
				to: bob,
				tokenIdentifier: '//XRD',
				amount: 1,
			})
			.build({
				spendingSender: radix.activeAddress,
			})
			.subscribe((intent) => {
				radix.activeAddress.subscribe(async (address) => {
					radix.ledger
						.buildTransaction(intent)
						.subscribe((unsignedTx) => {
							expect(
								(unsignedTx as { fee: AmountT }).fee.toString(),
							).toEqual('50')
							done()
						})
						.add(subs)
				})
			})
	})

	it.skip('should get network transaction demand response', (done) => {
		// not implemented in core
		const radix = Radix.create()
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		radix.ledger
			.networkTransactionDemand()
			.subscribe((result) => {
				expect(result.tps).toEqual(109)
				done()
			})
			.add(subs)
	})

	it.skip('should get network transaction throughput response', (done) => {
		// not implemented in core
		const radix = Radix.create()
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		radix.ledger
			.networkTransactionThroughput()
			.subscribe((result) => {
				expect(result.tps).toEqual(10)
				done()
			})
			.add(subs)
	})

	it.skip('can fetch stake positions', (done) => {
		// not implemented in core
		const radix = Radix.create()
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)
			.withStakingFetchTrigger(interval(500))

		radix.stakingPositions
			.pipe(
				map((sp) => sp.map((p) => p.amount.magnitude.valueOf() % 100)),
				toArray(),
			)
			.subscribe((values) => {
				console.log(values)
				done()
			})
	})

	it.skip('can fetch unstake positions', (done) => {
		// not implemented in core
		const radix = Radix.create()
			.connect(`${NODE_URL}/rpc`)
			.withWallet(makeWalletWithFunds())
			.withStakingFetchTrigger(interval(500))

		radix.unstakingPositions.subscribe((values) => {
			expect(values[0]).toBeDefined()
			done()
		})
	})

	describe('make tx single transfer', () => {
		// needs fix to handle arrays params
		const tokenTransferInput: TransferTokensInput = {
			to: bob,
			amount: 1,
			tokenIdentifier: '//XRD',
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

		it('events emits expected values', (done) => {
			const radix = Radix.create()
				.withWallet(makeWalletWithFunds())
				.connect(`${NODE_URL}/rpc`)

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

			radix.activeAddress.subscribe((address) => {
				console.log('ADDRESS:', address.toString())

				radix
					.transferTokens(transferTokens())
					.events.pipe(
						map((e) => e.eventUpdateType),
						take(expectedValues.length),
						toArray(),
					)
					.subscribe({
						next: (values) => {
							expect(values).toStrictEqual(expectedValues)
							done()
						},
						error: (e) => {
							done(
								new Error(
									`Tx failed, even though we expected it to succeed, error: ${e.toString()}`,
								),
							)
						},
					})
					.add(subs)
			})
		})

		it('automatic confirmation', (done) => {
			const radix = Radix.create()
				.withWallet(makeWalletWithFunds())
				.connect(`${NODE_URL}/rpc`)

			let gotTXId = false

			radix
				.transferTokens(transferTokens())
				.completion.subscribe({
					next: (_txID) => {
						gotTXId = true
					},
					complete: () => {
						done()
					},
					error: (e) => {
						done(
							new Error(
								`Tx failed, but expected to succeed. Error ${e}`,
							),
						)
					},
				})
				.add(subs)
		})

		it('manual confirmation', (done) => {
			const radix = Radix.create()
				.withWallet(makeWalletWithFunds())
				.connect(`${NODE_URL}/rpc`)

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

			userConfirmation
				.subscribe((txn) => {
					//@ts-ignore
					transaction = txn
					shouldShowConfirmation()
				})
				.add(subs)

			transactionTracking.completion
				.subscribe({
					next: (_txID) => {
						//@ts-ignore
						expect(userHasBeenAskedToConfirmTX).toBe(true)
						done()
					},
					error: (e) => {
						done(e)
					},
				})
				.add(subs)
		})

		it.skip('should be able to call stake tokens', (done) => {
			// not implemented in core
			const radix = Radix.create()
				.withWallet(makeWalletWithFunds())
				.connect(`${NODE_URL}/rpc`)

			radix.ledger
				.validators({
					size: 1,
				})
				.subscribe((validators) => {
					radix
						.stakeTokens({
							stakeInput: {
								amount: 1,
								validator: validators.validators[0].address,
							},
							userConfirmation: 'skip',
							pollTXStatusTrigger: pollTXStatusTrigger,
						})
						.completion.subscribe({
							complete: () => {
								done()
							},
							error: (e) => {
								done(
									new Error(
										`Tx failed, but expected to succeed. Error ${e}`,
									),
								)
							},
						})
						.add(subs)
				})
				.add(subs)
		})

		it.skip('should be able to call unstake tokens', (done) => {
			// not implemented in core
			const radix = Radix.create()
				.withWallet(makeWalletWithFunds())
				.connect(`${NODE_URL}/rpc`)

			radix.ledger
				.validators({
					size: 1,
				})
				.subscribe((validators) => {
					radix
						.unstakeTokens({
							unstakeInput: {
								amount: 1,
								validator: validators.validators[0].address,
							},
							userConfirmation: 'skip',
							pollTXStatusTrigger: pollTXStatusTrigger,
						})
						.completion.subscribe({
							complete: () => {
								done()
							},
							error: (e) => {
								done(
									new Error(
										`Tx failed, but expected to succeed. Error ${e}`,
									),
								)
							},
						})
						.add(subs)
				})
		})
	})
})
