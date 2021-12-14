/**
 * @group integration
 */

/* eslint-disable */
import axios from 'axios'
axios.defaults.adapter = require('axios/lib/adapters/http')
import { Radix } from '../../radix'
import { ValidatorAddressT } from '@account'
import { firstValueFrom, interval, Subject, Subscription } from 'rxjs'
import {
	delay,
	filter,
	map,
	mergeMap,
	retry,
	retryWhen,
	take,
	tap,
	toArray,
} from 'rxjs/operators'
import {
	PendingTransaction,
	TransactionStateSuccess,
	TransactionStatus,
} from '../../dto/_types'
import { Amount, AmountT, Network } from '@primitives'
import {
	TransactionTrackingEventType,
	KeystoreT,
	log,
	restoreDefaultLogLevel,
	AccountT,
} from '../..'
import { UInt256 } from '@radixdlt/uint256'
import { keystoreForTest, makeWalletWithFunds } from '../util'
import {
	AccountBalancesEndpoint,
	Decoded,
	StakePositionsEndpoint,
} from '../../api/open-api/_types'

const fetch = require('node-fetch')

const network = Network.STOKENET

// local
// const NODE_URL = 'http://localhost:8080'

// RCNet
//const NODE_URL = 'https://54.73.253.49'

// release net
//const NODE_URL = 'https://18.168.73.103'

// const NODE_URL = 'https://sandpitnet-gateway.radixdlt.com'

// const NODE_URL = 'https://milestonenet-gateway.radixdlt.com'

const NODE_URL = 'https://stokenet-gateway.radixdlt.com'

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
let balances: Decoded.AccountBalances
let nativeTokenBalance: Decoded.TokenAmount

describe('integration API tests', () => {
	beforeAll(async () => {
		log.setLevel('INFO')
		radix = Radix.create()
		await radix
			.__withWallet(makeWalletWithFunds(network))
			.connect(`${NODE_URL}`)
		accounts = (
			await firstValueFrom(radix.restoreLocalHDAccountsToIndex(2))
		).all

		balances = (await radix.tokenBalances())._unsafeUnwrap()
		const maybeTokenBalance = balances.liquid_balances.find(
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
	afterAll(() => {
		restoreDefaultLogLevel()
	})

	it('can connect and is chainable', async () => {
		const radix = Radix.create()
		await radix.connect(`${NODE_URL}`)

		expect(radix).toBeDefined()
		expect(radix.tokenBalances).toBeDefined() // etc
	})

	// it('emits node connection without wallet', async () => {
	// 	const radix = Radix.create()
	// 	await radix.connect(`${NODE_URL}`)

	// 	// subs.add(
	// 	// 	radix.__node.subscribe(
	// 	// 		node => {
	// 	// 			expect(node.url.host).toBe(new URL(NODE_URL).host)
	// 	// 			done()
	// 	// 		},
	// 	// 		error => done(error),
	// 	// 	),
	// 	// )
	// })

	it.skip('can switch networks', async () => {
		const radix = Radix.create()

		await radix
			.login(keystoreForTest.password, loadKeystore)
			.connect(`${NODE_URL}`)

		const address1 = await firstValueFrom(radix.activeAddress)
		expect(address1.network).toBeDefined()

		await radix.connect('https://mainnet.radixdlt.com')

		const address2 = await firstValueFrom(radix.activeAddress)
		expect(address2.network).toBeDefined()

		await radix.connect('https://stokenet.radixdlt.com')

		const address3 = await firstValueFrom(radix.activeAddress)
		expect(address3.network).toBeDefined()
	})

	it('returns native token without wallet', async () => {
		const radix = Radix.create()
		radix.connect(`${NODE_URL}`)

		const api = await radix.api()
		const result = await api.nativeToken({
			network_identifier: { network },
		})

		result.map(token => {
			expect(token.symbol).toBe('xrd')
		})
	})

	/*

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
	it.only('should compare token balance before and after transfer', async () => {
		const address = await firstValueFrom(radix.activeAddress)
		await requestFaucet(address.toString())

		const amountToSend = Amount.fromUnsafe(
			`1${'0'.repeat(18)}`,
		)._unsafeUnwrap()

		const getXRDBalanceOrZero = (
			tokenBalances: Decoded.AccountBalances,
		) => {
			const maybeTokenBalance = tokenBalances.liquid_balances.find(
				a => a.token_identifier.rri.name.toLowerCase() === 'xrd',
			)
			return maybeTokenBalance
				? maybeTokenBalance.value
				: UInt256.valueOf(0)
		}

		const tokenBalancesBefore = (await radix.tokenBalances()).unwrapOr(null)

		if (!tokenBalancesBefore) {
			throw new Error('invalid tokenBalancesBefore output')
		}

		const initialBalance = getXRDBalanceOrZero(tokenBalancesBefore)

		const transferTokens = (
			await radix.transferTokens(
				accounts[2].address,
				amountToSend,
				nativeTokenBalance.token_identifier.rri,
			)
		).unwrapOr(null)

		if (!transferTokens) {
			throw new Error('invalid transferTokens output')
		}

		const txID = await firstValueFrom(transferTokens.completion)

		const txStatus = (
			await (await radix.api()).transactionStatus(txID, network)
		).unwrapOr(null)

		if (!txStatus) {
			throw new Error('invalid txStatus output')
		}

		const tokenBalancesAfter = (await radix.tokenBalances()).unwrapOr(null)

		if (!tokenBalancesAfter) {
			throw new Error('invalid tokenBalancesAfter output')
		}

		const balanceAfterTransfer = getXRDBalanceOrZero(tokenBalancesAfter)

		expect(
			initialBalance.sub(amountToSend).sub(txStatus.fee).toString(),
		).toBe(balanceAfterTransfer.toString())
	})

	/*

	// 🟢 can only test this on localnet
	it.skip('should increment transaction history with a new transaction after transfer', async done => {
		const pageSize = 15

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

						while (cursor) {
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
									to_account: accounts[2].address,
									amount: 1,
									tokenIdentifier:
										nativeTokenBalance.token_identifier.rri,
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

	it('should be able to get transaction history', async () => {
		const txID1 = await firstValueFrom(
			radix.transferTokens({
				transferInput: {
					to_account: accounts[2].address,
					amount: 1,
					tokenIdentifier: nativeTokenBalance.token_identifier.rri,
				},
				userConfirmation: 'skip',
			}).completion,
		)

		const txID2 = await firstValueFrom(
			radix.transferTokens({
				transferInput: {
					to_account: accounts[2].address,
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
		const txTracking = radix.transferTokens({
			transferInput: {
				to_account: accounts[2].address,
				amount: 1,
				tokenIdentifier: nativeTokenBalance.token_identifier.rri,
			},
			userConfirmation: 'skip',
			pollTXStatusTrigger: interval(1000),
		})

		txTracking.events.subscribe(event => {
			if (
				event.eventUpdateType === TransactionTrackingEventType.SUBMITTED
			) {
				const txID: TransactionIdentifierT = (
					event as TransactionStateSuccess<PendingTransaction>
				).transactionState.txID

				subs.add(
					radix
						.transactionStatus(txID, interval(1000))
						.pipe(
							// after a transaction is submitted there is a delay until it appears in transaction status
							retryWhen(retryOnErrorCode({ errorCodes: [404] })),
						)
						.subscribe(({ status }) => {
							expect(status).toEqual(TransactionStatus.CONFIRMED)
							done()
						}),
				)
			}
		})
	})

	it('can lookup tx', async () => {
		const { completion } = radix.transferTokens({
			transferInput: {
				to_account: accounts[2].address,
				amount: 1,
				tokenIdentifier: nativeTokenBalance.token_identifier.rri,
			},
			userConfirmation: 'skip',
			pollTXStatusTrigger: interval(3000),
		})

		const txID = await firstValueFrom(completion)
		const tx = await firstValueFrom(radix.getTransaction(txID))

		expect(txID.equals(tx.txID)).toBe(true)
		expect(tx.actions.length).toEqual(2)
	})

	it('can lookup validator', async () => {
		const validator = (
			await firstValueFrom(radix.ledger.validators(network))
		).validators[0]
		const validatorFromLookup = await firstValueFrom(
			radix.ledger.lookupValidator(validator.address),
		)

		expect(validatorFromLookup.address.equals(validator.address)).toBe(true)
	})

	it('should get validators', async () => {
		const validators = await firstValueFrom(
			radix.ledger.validators(network),
		)

		expect(validators.validators.length).toBeGreaterThan(0)
	})

	const getValidators = async () =>
		(await firstValueFrom(radix.ledger.validators(network))).validators

	const getValidatorStakeAmountForAddress = (
		{ stakes, pendingStakes }: StakePositionsEndpoint.DecodedResponse,
		validatorAddress: ValidatorAddressT,
	) => {
		const validatorStake = stakes.find(values =>
			values.validator.equals(validatorAddress),
		)
		const validatorPendingStake = pendingStakes.find(values =>
			values.validator.equals(validatorAddress),
		)

		const stakeAmount = validatorStake
			? validatorStake.amount
			: Amount.fromUnsafe(0)._unsafeUnwrap()

		const pendingStakeAmount = validatorPendingStake
			? validatorPendingStake.amount
			: Amount.fromUnsafe(0)._unsafeUnwrap()

		return stakeAmount.add(pendingStakeAmount)
	}

	it('can fetch stake positions', async done => {
		const triggerSubject = new Subject<number>()

		radix.withStakingFetchTrigger(triggerSubject)

		const stakeAmount = Amount.fromUnsafe(
			'100000000000000000000',
		)._unsafeUnwrap()

		const [validator] = await getValidators()

		const initialStake = await firstValueFrom(
			radix.stakingPositions.pipe(
				map(res =>
					getValidatorStakeAmountForAddress(res, validator.address),
				),
			),
		)

		const expectedStake = initialStake.add(stakeAmount).toString()

		subs.add(
			(
				await radix.stakeTokens({
					stakeInput: {
						amount: stakeAmount,
						to_validator: validator.address,
					},
					userConfirmation: 'skip',
					pollTXStatusTrigger: interval(1000),
				})
			).completion
				.pipe(
					tap(() => {
						triggerSubject.next(0)
					}),
					delay(1000),
					mergeMap(_ =>
						radix.stakingPositions.pipe(
							map(res =>
								getValidatorStakeAmountForAddress(
									res,
									validator.address,
								),
							),
							map(actualStake => {
								if (actualStake.eq(initialStake)) {
									log.info(
										'radix.stakingPositions is not done fetching lets retry 🔄',
									)
									throw { error: { code: 999 } }
								} else {
									return actualStake.toString()
								}
							}),
							retryWhen(retryOnErrorCode({ errorCodes: [999] })),
						),
					),
				)
				.subscribe(actualStake => {
					expect(actualStake).toEqual(expectedStake)
					done()
				}),
		)
	})

	it('can fetch unstake positions', async () => {
		const triggerSubject = new Subject<number>()

		radix.withStakingFetchTrigger(triggerSubject)

		const stakeAmount = Amount.fromUnsafe(
			'100000000000000000000',
		)._unsafeUnwrap()

		const unstakeAmount =
			Amount.fromUnsafe('100000000000000000')._unsafeUnwrap()
		const validator = (await firstValueFrom(radix.validators()))
			.validators[0]

		const stake = await radix.stakeTokens({
			stakeInput: {
				amount: stakeAmount,
				to_validator: validator.address,
			},
			userConfirmation: 'skip',
			pollTXStatusTrigger: interval(1000),
		})

		await firstValueFrom(stake.completion)

		const unstake = await radix.unstakeTokens({
			unstakeInput: {
				amount: unstakeAmount,
				from_validator: validator.address,
			},
			userConfirmation: 'skip',
			pollTXStatusTrigger: interval(1000),
		})

		await firstValueFrom(unstake.completion)

		triggerSubject.next(0)

		const positions = await firstValueFrom(radix.unstakingPositions)

		expect(positions[0].amount).toBeDefined()
	})

	*/

	/*
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
