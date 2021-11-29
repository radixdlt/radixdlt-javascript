/**
 * @group integration
 */

/* eslint-disable */
import { Radix } from '../../src/radix'
import { ValidatorAddressT } from '@radixdlt/account'
import {
	firstValueFrom,
	interval,
	Observable,
	ReplaySubject,
	Subject,
	Subscription,
} from 'rxjs'
import { map, take, tap, toArray } from 'rxjs/operators'
import { ManualUserConfirmTX } from '../../src/_types'
import {
	PendingTransaction,
	TransactionIdentifierT,
	TransactionStateSuccess,
	TransactionStatus,
} from '../../src/dto/_types'
import { Amount, AmountT, Network } from '@radixdlt/primitives'
import {
	TransferTokensOptions,
	TransferTokensInput,
	TransactionTrackingEventType,
	KeystoreT,
} from '../../src'
import { UInt256 } from '@radixdlt/uint256'
import { AccountT, RadixT, TokenBalance, TokenBalances } from '../../src'
import { keystoreForTest, makeWalletWithFunds } from '../util'
import { AccountBalancesEndpoint, Decoded } from '../../src/api/open-api/_types'

const fetch = require('node-fetch')

const network = Network.LOCALNET

// local
const NODE_URL = 'http://localhost:8080'

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
let balances: AccountBalancesEndpoint.DecodedResponse
let nativeTokenBalance: Decoded.TokenAmount

describe('integration API tests', () => {
	beforeAll(async () => {
		radix = Radix.create()
		await radix
			.__withWallet(makeWalletWithFunds(network))
			.connect(`${NODE_URL}`)
		accounts = (
			await firstValueFrom(radix.restoreLocalHDAccountsToIndex(2))
		).all
		balances = await firstValueFrom(radix.tokenBalances)
		const maybeTokenBalance =
			balances.account_balances.liquid_balances.find(
				a => a.token_identifier.rri.name.toLowerCase() === 'xrd',
			)
		if (!maybeTokenBalance) {
			throw Error('no XRD found')
		}
		nativeTokenBalance = maybeTokenBalance
	})

	beforeEach(() => {
		subs = new Subscription()
	})
	afterEach(() => {
		subs.unsubscribe()
	})

	it('can connect and is chainable', async () => {
		const radix = Radix.create()
		await radix.connect(`${NODE_URL}`)

		expect(radix).toBeDefined()
		expect(radix.ledger.nativeToken).toBeDefined()
		expect(radix.ledger.tokenBalancesForAddress).toBeDefined() // etc
	})

	/*
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
	*/

	it('returns native token without wallet', async done => {
		const radix = Radix.create()
		radix.connect(`${NODE_URL}`)

		subs.add(
			radix.ledger.nativeToken('mainnet').subscribe(
				token => {
					expect(token.symbol).toBe('xrd')
					done()
				},
				error => done(error),
			),
		)
	})
	/*
	it.only('deriveNextSigningKey method on radix updates accounts', done => {
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
		const getTokenBalanceSubject = new Subject<number>()

		radix.withTokenBalanceFetchTrigger(getTokenBalanceSubject)

		getTokenBalanceSubject.next(1)

		let transferDone = false
		const amountToSend = Amount.fromUnsafe(
			`1${'0'.repeat(18)}`,
		)._unsafeUnwrap()

		let initialBalance: AmountT
		let balanceAfterTransfer: AmountT
		let fee: AmountT

		radix.activeAddress.subscribe(async address => {
			await requestFaucet(address.toString())

			subs.add(
				radix.tokenBalances.subscribe(balance => {
					const getXRDBalanceOrZero = (): AmountT => {
						const maybeTokenBalance =
							balance.account_balances.liquid_balances.find(
								a =>
									a.token_identifier.rri.name.toLowerCase() ===
									'xrd',
							)
						return maybeTokenBalance !== undefined
							? maybeTokenBalance.value
							: UInt256.valueOf(0)
					}

					if (transferDone) {
						balanceAfterTransfer = getXRDBalanceOrZero()

						expect(
							initialBalance
								.sub(balanceAfterTransfer)
								.eq(amountToSend.add(fee)),
						).toBe(true)
						done()
					} else {
						initialBalance = getXRDBalanceOrZero()
					}
				}),
			)

			subs.add(
				radix
					.transferTokens({
						transferInput: {
							to: accounts[2].address,
							amount: amountToSend,
							tokenIdentifier:
								nativeTokenBalance.token_identifier.rri,
						},
						userConfirmation: 'skip',
						pollTXStatusTrigger: interval(500),
					})
					.completion.subscribe(txID => {
						transferDone = true
						subs.add(
							radix.ledger
								.transactionStatus(txID, 'mainnet')
								.subscribe(tx => {
									fee = tx.fee
									getTokenBalanceSubject.next(1)
								}),
						)
					}),
			)
		})
	})
	/*
	// 🟢
	it('should increment transaction history with a new transaction after transfer', async done => {
		const pageSize = 100

		const fetchTxHistory = (cursor: string) => {
			return new Promise<[string, number]>((resolve, _) => {
				const sub = radix
					.transactionHistory({
						size: pageSize,
						cursor,
					})
					.subscribe(txHistory => {
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
					.subscribe(async txHistory => {
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

		subs.add(
			radix
				.transactionHistory({
					size: pageSize,
					cursor,
				})
				.subscribe(txHistory => {
					const countBeforeTransfer = txHistory.transactions.length
					subs.add(
						radix
							.transferTokens({
								transferInput: {
									to: accounts[2].address,
									amount: 1,
									tokenIdentifier:
										nativeTokenBalance.token.rri,
								},
								userConfirmation: 'skip',
								pollTXStatusTrigger: interval(500),
							})
							.completion.subscribe(tx => {
								subs.add(
									radix
										.transactionHistory({
											size: pageSize,
											cursor,
										})
										.subscribe(newTxHistory => {
											expect(
												newTxHistory.transactions
													.length - 1,
											).toEqual(countBeforeTransfer)
											done()
										}),
								)
							}),
					)
				}),
		)
	})
	
	// 🟢
	it.only('should be able to get transaction history', async () => {
		const txID1 = await firstValueFrom(
			radix.transferTokens({
				transferInput: {
					to: accounts[2].address,
					amount: 1,
					tokenIdentifier: nativeTokenBalance.token_identifier.rri,
				},
				userConfirmation: 'skip',
			}).completion,
		)

		const txID2 = await firstValueFrom(
			radix.transferTokens({
				transferInput: {
					to: accounts[2].address,
					amount: 1,
					tokenIdentifier: nativeTokenBalance.token_identifier.rri,
				},
				userConfirmation: 'skip',
			}).completion,
		)

		const txHistory = await firstValueFrom(
			radix.transactionHistory({ size: 2 }),
		)

		expect(txHistory.transactions[0].txID.equals(txID1))
		expect(txHistory.transactions[1].txID.equals(txID2))
	})
	
	// 🟢
	it('should handle transaction status updates', done => {
		const expectedValues: TransactionStatus[] = [
			TransactionStatus.PENDING,
			TransactionStatus.CONFIRMED,
		]

		const txTracking = radix.transferTokens({
			transferInput: {
				to: accounts[2].address,
				amount: 1,
				tokenIdentifier: nativeTokenBalance.token.rri,
			},
			userConfirmation: 'skip',
			pollTXStatusTrigger: interval(200),
		})

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
		const { completion } = radix.transferTokens({
			transferInput: {
				to: accounts[2].address,
				amount: 1,
				tokenIdentifier: nativeTokenBalance.token.rri,
			},
			userConfirmation: 'skip',
			pollTXStatusTrigger: interval(500),
		})

		const txID = await firstValueFrom(completion)
		const tx = await firstValueFrom(radix.ledger.lookupTransaction(txID))

		expect(txID.equals(tx.txID)).toBe(true)
		expect(tx.actions.length).toEqual(1)
	})

	// 🟢
	it('can lookup validator', async () => {
		const validator = (
			await firstValueFrom(radix.ledger.validators({ size: 1 }))
		).validators[0]
		const validatorFromLookup = await firstValueFrom(
			radix.ledger.lookupValidator(validator.address),
		)

		expect(validatorFromLookup.address.equals(validator.address)).toBe(true)
	})

	*/

	// 🟢
	it('should get validators', async () => {
		const validators = await firstValueFrom(
			radix.ledger.validators({ network }),
		)

		expect(validators.validators.length).toEqual(1)
	})

	/*

	// 🟢
	it('should be able to paginate validators', async () => {
		const validators = await firstValueFrom(
			radix.ledger.validators({ size: 2 }),
		)

		const firstValidator = await firstValueFrom(
			radix.ledger.validators({ size: 1 }),
		)

		const cursor = firstValidator.cursor

		expect(validators.validators[0].address.toString()).toEqual(
			firstValidator.validators[0].address.toString(),
		)

		const secondValidator = await firstValueFrom(
			radix.ledger.validators({ size: 1, cursor }),
		)

		expect(validators.validators[1].address.toString()).toEqual(
			secondValidator.validators[0].address.toString(),
		)
	})

	// 🟢
	it('should get network transaction demand response', async () => {
		const result = await firstValueFrom(
			radix.ledger.NetworkTransactionDemand(),
		)

		expect(result.tps).toEqual(0)
	})

	// 🟢
	it('should get network transaction throughput response', async () => {
		const result = await firstValueFrom(
			radix.ledger.NetworkTransactionThroughput(),
		)

		expect(result.tps).toBeGreaterThan(0)
	})

	// 🟢
	it('can fetch stake positions', async done => {
		const triggerSubject = new Subject<number>()

		radix.withStakingFetchTrigger(triggerSubject)

		const stakeAmount = Amount.fromUnsafe(
			'100000000000000000000',
		)._unsafeUnwrap()

		let validatorResolve: any
		const validatorPromise = new Promise<ValidatorAddressT>(
			(resolve, _) => {
				validatorResolve = resolve
			},
		)

		let initialAmountResolve: any
		let initialAmountPromise = new Promise<AmountT>((resolve, _) => {
			initialAmountResolve = resolve
		})

		let hasStaked = false

		subs.add(
			radix.ledger
				.validators({
					size: 1,
				})
				.subscribe(({ validators }) => {
					validatorResolve(validators[0].address)
				}),
		)

		subs.add(
			radix.stakingPositions.subscribe(async values => {
				const validator = await validatorPromise

				if (hasStaked) {
					const initialAmountStaked = await initialAmountPromise

					const amountAfterStaking = values.find(value =>
						value.validator.equals(validator),
					)!.amount

					expect(
						amountAfterStaking.eq(
							initialAmountStaked.add(stakeAmount),
						),
					).toEqual(true)
					done()
				} else {
					const stake = values.find(value =>
						value.validator.equals(validator),
					)
					initialAmountResolve(
						stake
							? stake.amount
							: Amount.fromUnsafe(0)._unsafeUnwrap(),
					)
				}
			}),
		)

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

		subs.add(
			completion.subscribe(_ => {
				hasStaked = true
				triggerSubject.next(0)
			}),
		)
	})

	it.skip('can fetch unstake positions', async () => {
		const triggerSubject = new Subject<number>()

		radix.withStakingFetchTrigger(triggerSubject)

		const stakeAmount = Amount.fromUnsafe(
			'100000000000000000000',
		)._unsafeUnwrap()

		const validator = (
			await firstValueFrom(radix.ledger.validators({ size: 1 }))
		).validators[0]

		await firstValueFrom(
			radix.stakeTokens({
				stakeInput: {
					amount: stakeAmount,
					validator: validator.address,
				},
				userConfirmation: 'skip',
				pollTXStatusTrigger: interval(1000),
			}).completion,
		)

		await firstValueFrom(
			radix.unstakeTokens({
				unstakeInput: {
					amount: stakeAmount,
					validator: validator.address,
				},
				userConfirmation: 'skip',
				pollTXStatusTrigger: interval(1000),
			}).completion,
		)

		triggerSubject.next(0)

		const positions = await firstValueFrom(radix.unstakingPositions)

		expect(positions[0].amount.eq(stakeAmount)).toBeTruthy()
	})

	// 🟢
	it('should be able to paginate validator result', async () => {
		const twoValidators = await firstValueFrom(
			radix.ledger.validators({ size: 2 }),
		)
		const firstValidator = await firstValueFrom(
			radix.ledger.validators({ size: 1 }),
		)
		const secondValidator = await firstValueFrom(
			radix.ledger.validators({ size: 1, cursor: firstValidator.cursor }),
		)

		expect(firstValidator.validators[0].address.toString()).toEqual(
			twoValidators.validators[0].address.toString(),
		)

		expect(secondValidator.validators[0].address.toString()).toEqual(
			twoValidators.validators[1].address.toString(),
		)
	})

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
					next: _txID => {},
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
