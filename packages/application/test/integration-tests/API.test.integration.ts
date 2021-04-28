/**
 * @group integration
 */

/* eslint-disable */
import { Radix } from '../../src/radix'
import { NetworkT, ValidatorAddress, ValidatorAddressT } from '@radixdlt/account'
import {
	interval,
	Observable,
	ReplaySubject,
	Subject,
	Subscription,
} from 'rxjs'
import { map, take, tap, toArray } from 'rxjs/operators'
import { ManualUserConfirmTX } from '../../src/_types'
import { bob } from '../../src/mockRadix'
import {
	PendingTransaction,
	TransactionIdentifierT,
	TransactionStateSuccess,
	TransactionStateUpdate,
	TransactionStatus,
} from '../../src/dto/_types'
import { Amount, AmountT } from '@radixdlt/primitives'
import { TransactionIntentBuilder } from '../../src/dto/transactionIntentBuilder'
import { TransactionTrackingEventType } from '../../src/dto/_types'
import { TransferTokensInput } from '../../src/actions/_types'
import { TransferTokensOptions } from '../../src/_types'
import { makeWalletWithFunds } from '../../../account/test/utils'
import { UInt256 } from '@radixdlt/uint256'
const fetch = require('node-fetch')


// local
//const NODE_URL = 'http://localhost:8080'

// RCNet
const NODE_URL = 'https://54.73.253.49'

// release net
//const NODE_URL = 'https://18.168.73.103'

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

describe('integration API tests', () => {
	let subs: Subscription

	beforeEach(() => {
		subs = new Subscription()
	})
	afterEach(() => {
		subs.unsubscribe()
	})

	it.only('can connect and is chainable', () => {
		const radix = Radix.create({
			network: NetworkT.BETANET,
		}).connect(`${NODE_URL}/rpc`)
		expect(radix).toBeDefined()
		expect(radix.ledger.nativeToken).toBeDefined()
		expect(radix.ledger.tokenBalancesForAddress).toBeDefined() // etc
	})

	it.only('emits node connection without wallet', async (done) => {
		const radix = Radix.create({
			network: NetworkT.BETANET,
		}).connect(`${NODE_URL}/rpc`)

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

	it.only('provides network for wallets', async (done) => {
		const radix = Radix.create({
			network: NetworkT.BETANET,
		})
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

	it.only('returns native token without wallet', async (done) => {
		const radix = Radix.create({
			network: NetworkT.BETANET,
		})
		radix.connect(`${NODE_URL}/rpc`)

		radix.ledger
			.nativeToken()
			.subscribe(
				(token) => {
					expect(token.symbol).toBe('xrd')
					done()
				},
				(error) => done(error),
			)
			.add(subs)
	})

	it.only('deriveNextAccount method on radix updates accounts', (done) => {
		const radix = Radix.create({
			network: NetworkT.BETANET,
		})
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

	it.only('deriveNextAccount alsoSwitchTo method on radix updates activeAccount', (done) => {
		const radix = Radix.create({
			network: NetworkT.BETANET,
		})
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

	it.only('deriveNextAccount alsoSwitchTo method on radix updates activeAddress', (done) => {
		const radix = Radix.create({
			network: NetworkT.BETANET,
		})
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

	it.only('should compare token balance before and after transfer', (done) => {
		const radix = Radix.create({
			network: NetworkT.BETANET,
		})
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

		radix.activeAddress.subscribe(async (address) => {
			await requestFaucet(address.toString())

			radix.tokenBalances
				.subscribe((balance) => {
					const getXRDBalanceOrZero = (): AmountT => {
						const maybeTokenBalance = balance.tokenBalances.find(
							(a) => a.token.symbol.toLowerCase() === 'xrd',
						)
						return maybeTokenBalance !== undefined
							? maybeTokenBalance.amount
							: UInt256.valueOf(0)
					}

					if (transferDone) {
						balanceAfterTransfer = getXRDBalanceOrZero()

						expect(
							initialBalance
								.sub(balanceAfterTransfer)
								.eq(amountToSend.add(fee)),
						).toEqual(true)
						done()
					} else {
						initialBalance = getXRDBalanceOrZero()
					}
				})
				.add(subs)

			radix
				.transferTokens({
					transferInput: {
						to: bob,
						amount: amountToSend,
						tokenIdentifier: `xrd_rb1qya85pwq`,
					},
					userConfirmation: 'skip',
					pollTXStatusTrigger: interval(500),
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
	})

	it.skip('should increment transaction history with a new transaction after transfer', async (done) => {
		const radix = Radix.create({
			network: NetworkT.BETANET,
		})
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		const pageSize = 3

		const fetchTxHistory = (cursor: string) => {
			return new Promise<[string, number]>((resolve, _) => {
				const sub = radix
					.transactionHistory({
						size: pageSize,
						cursor,
					})
					.subscribe((txHistory) => {
						sub.unsubscribe()
						resolve([
							txHistory.cursor,
							txHistory.transactions.length,
						])
					})
			})
		}

		const getLastCursor = async () => {
			return new Promise<string>((resolve, _) => {
				radix
					.transactionHistory({
						size: pageSize,
					})
					.subscribe(async (txHistory) => {
						let cursor = txHistory.cursor
						let prevTxCount = 0
						let txCount = 0

						while (txCount >= prevTxCount) {
							prevTxCount = txCount
								;[cursor, txCount] = await fetchTxHistory(cursor)
						}

						resolve(cursor)
					})
			})
		}

		const cursor = await getLastCursor()

		radix
			.transactionHistory({
				size: pageSize,
				cursor,
			})
			.subscribe((txHistory) => {
				const countBeforeTransfer = txHistory.transactions.length
				radix
					.transferTokens({
						transferInput: {
							to: bob,
							amount: 1,
							tokenIdentifier: `xrd_rb1qya85pwq`,
						},
						userConfirmation: 'skip',
						pollTXStatusTrigger: interval(500),
					})
					.completion.subscribe((tx) => {
						radix
							.transactionHistory({
								size: pageSize,
								cursor,
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

	it.only('should be able to get transaction history', (done) => {
		const radix = Radix.create({
			network: NetworkT.BETANET,
		})
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		radix
			.transferTokens({
				transferInput: {
					to: bob,
					amount: 1,
					tokenIdentifier: `xrd_rb1qya85pwq`,
				},
				userConfirmation: 'skip',
			})
			.completion.subscribe((txID1) => {
				radix
					.transferTokens({
						transferInput: {
							to: bob,
							amount: 1,
							tokenIdentifier: `xrd_rb1qya85pwq`,
						},
						userConfirmation: 'skip',
					})
					.completion.subscribe((txID2) => {
						radix
							.transactionHistory({
								size: 2,
							})
							.subscribe((txHistory) => {
								expect(txHistory.transactions[0].txID.equals(txID1))
								expect(txHistory.transactions[1].txID.equals(txID2))
								done()
							})
					})
			})
	})

	it.skip('should handle transaction status updates', (done) => {
		// can't test because it becomes confirmed immediately
		const radix = Radix.create({
			network: NetworkT.BETANET,
		})
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		const expectedValues: TransactionStatus[] = [
			TransactionStatus.PENDING,
			TransactionStatus.CONFIRMED,
		]


		const txTracking = radix.transferTokens({
			transferInput: {
				to: bob,
				amount: 1,
				tokenIdentifier: `xrd_rb1qya85pwq`,
			},
			userConfirmation: 'skip',
			pollTXStatusTrigger: interval(200),
		})


		txTracking.events.subscribe((event) => {
			if (
				event.eventUpdateType ===
				TransactionTrackingEventType.SUBMITTED
			) {
				const txID: TransactionIdentifierT = (event as TransactionStateSuccess<PendingTransaction>)
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

	it.only('can lookup tx', async (done) => {
		const radix = Radix.create({
			network: NetworkT.BETANET,
		})
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		const { completion } = radix.transferTokens({
			transferInput: {
				to: bob,
				amount: 1,
				tokenIdentifier: `xrd_rb1qya85pwq`,
			},
			userConfirmation: 'skip',
			pollTXStatusTrigger: interval(500),
		})

		completion.subscribe(async txID => {
			radix.ledger.lookupTransaction(txID).subscribe((tx) => {
				expect(txID.equals(tx.txID)).toBe(true)
				expect(tx.actions.length).toEqual(1)
				done()
			}).add(subs)
		}).add(subs)
	})

	it.only('can lookup validator', (done) => {
		const radix = Radix.create({
			network: NetworkT.BETANET,
		})
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

	it.only('should get validators', (done) => {
		const radix = Radix.create({
			network: NetworkT.BETANET,
		})
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		radix.ledger
			.validators({
				size: 1,
				cursor: '',
			})
			.subscribe((validators) => {
				expect(validators.validators.length).toEqual(1)
				done()
			})
			.add(subs)
	})

	it.only('should be able to paginate validators', (done) => {
		const radix = Radix.create({
			network: NetworkT.BETANET,
		})
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		radix.ledger
			.validators({
				size: 2,
			})
			.subscribe((validators) => {
				radix.ledger
					.validators({
						size: 1,
					})
					.subscribe((firstValidator) => {
						const cursor = firstValidator.cursor

						expect(
							validators.validators[0].address.toString(),
						).toEqual(
							firstValidator.validators[0].address.toString(),
						)

						radix.ledger
							.validators({
								size: 1,
								cursor,
							})
							.subscribe((secondValidator) => {
								expect(
									validators.validators[1].address.toString(),
								).toEqual(
									secondValidator.validators[0].address.toString(),
								)
								done()
							})
							.add(subs)
					})
					.add(subs)
			})
			.add(subs)
	})

	it.only('should get network transaction demand response', (done) => {
		const radix = Radix.create({
			network: NetworkT.BETANET,
		})
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		radix.ledger
			.networkTransactionDemand()
			.subscribe((result) => {
				expect(result.tps).toEqual(0)
				done()
			})
			.add(subs)
	})

	it.only('should get network transaction throughput response', (done) => {
		const radix = Radix.create({
			network: NetworkT.BETANET,
		})
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		radix.ledger
			.networkTransactionThroughput()
			.subscribe((result) => {
				expect(result.tps).toEqual(0)
				done()
			})
			.add(subs)
	})

	it.only('can fetch stake positions', async (done) => {
		const triggerSubject = new Subject<number>()

		const radix = Radix.create({
			network: NetworkT.BETANET,
		})
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)
			.withStakingFetchTrigger(triggerSubject)

		const stakeAmount = Amount.fromUnsafe(1)._unsafeUnwrap()

		let validatorResolve: any
		const validatorPromise = new Promise<ValidatorAddressT>((resolve, _) => {
			validatorResolve = resolve
		})

		let initialAmountResolve: any
		let initialAmountPromise = new Promise<AmountT>((resolve, _) => {
			initialAmountResolve = resolve
		})

		let hasStaked = false

		radix.ledger
			.validators({
				size: 1,
			})
			.subscribe(({ validators }) => {
				validatorResolve(validators[0].address)
			}).add(subs)

		radix.stakingPositions.subscribe(async (values) => {
			const validator = await validatorPromise

			if (hasStaked) {
				const initialAmountStaked = await initialAmountPromise

				const amountAfterStaking = values.find((value) =>
					value.validator.equals(validator),
				)!.amount

				expect(
					amountAfterStaking.eq(
						initialAmountStaked.add(stakeAmount),
					),
				).toEqual(true)
				done()
			} else {
				const stake = values.find((value) =>
					value.validator.equals(validator),
				)
				initialAmountResolve(stake ? stake.amount : Amount.fromUnsafe(0)._unsafeUnwrap())
			}
		}).add(subs)

		triggerSubject.next(0)

		const validator = await validatorPromise

		const { completion } = radix.stakeTokens({
			stakeInput: {
				amount: stakeAmount,
				validator: validator,
			},
			userConfirmation: 'skip',
			pollTXStatusTrigger: interval(1000),
		})

		completion.subscribe((_) => {
			hasStaked = true
			triggerSubject.next(0)
		}).add(subs)

	})

	it.only('can fetch unstake positions', (done) => {
		const triggerSubject = new Subject<number>()

		const radix = Radix.create({
			network: NetworkT.BETANET,
		})
			.connect(`${NODE_URL}/rpc`)
			.withWallet(makeWalletWithFunds())
			.withStakingFetchTrigger(triggerSubject)

		const stakeAmount = Amount.fromUnsafe(1)._unsafeUnwrap()

		radix.ledger
			.validators({
				size: 1,
			})
			.subscribe(({ validators }) => {
				const validator = validators[0]

				radix
					.stakeTokens({
						stakeInput: {
							amount: stakeAmount,
							validator: validator.address,
						},
						userConfirmation: 'skip',
						pollTXStatusTrigger: interval(1000),
					})
					.completion.subscribe((_) => {
						radix
							.unstakeTokens({
								unstakeInput: {
									amount: stakeAmount,
									validator: validator.address,
								},
								userConfirmation: 'skip',
								pollTXStatusTrigger: interval(1000),
							})
							.completion.subscribe((_) => {
								radix.unstakingPositions.subscribe((values) => {
									// cannot assert right now because core immediately processes unstake
									done()
								}).add(subs)
							})
					}).add(subs)
				triggerSubject.next(0)
			}).add(subs)
	})

	it.only('should be able to paginate validator result', (done) => {
		const radix = Radix.create({
			network: NetworkT.BETANET,
		})
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		radix.ledger
			.validators({
				size: 2,
			})
			.subscribe((twoValidators) => {
				radix.ledger
					.validators({
						size: 1,
					})
					.subscribe((firstValidator) => {
						radix.ledger
							.validators({
								size: 1,
								cursor: firstValidator.cursor,
							})
							.subscribe((secondValidator) => {
								expect(
									firstValidator.validators[0].address.toString(),
								).toEqual(
									twoValidators.validators[0].address.toString(),
								)
								expect(
									secondValidator.validators[0].address.toString(),
								).toEqual(
									twoValidators.validators[1].address.toString(),
								)
								done()
							})
					}).add(subs)
			}).add(subs)
	})

	describe.only('make tx single transfer', () => {
		const tokenTransferInput: TransferTokensInput = {
			to: bob,
			amount: 1,
			tokenIdentifier: 'xrd_rb1qya85pwq',
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

		it.skip('events emits expected values', (done) => {
			// can't see pending state because quick confirmation
			const radix = Radix.create({
				network: NetworkT.BETANET,
			})
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

			radix
				.transferTokens(transferTokens())
				.events.pipe(
					map((e) => e.eventUpdateType),
					tap(x => console.log(x)),
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

		it('automatic confirmation', (done) => {
			const radix = Radix.create({
				network: NetworkT.BETANET,
			})
				.withWallet(makeWalletWithFunds())
				.connect(`${NODE_URL}/rpc`)

			radix
				.transferTokens(transferTokens())
				.completion.subscribe({
					next: (_txID) => { },
					complete: () => {
						done()
					},
					error: (e) => {
						done(
							new Error(
								`Tx failed, but expected to succeed. Error ${JSON.stringify(e, null, 2)}`,
							),
						)
					},
				})
				.add(subs)
		})

		it('manual confirmation', (done) => {
			const radix = Radix.create({
				network: NetworkT.BETANET,
			})
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
	})
})
