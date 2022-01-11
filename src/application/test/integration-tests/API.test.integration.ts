/**
 * @group integration
 */

/* eslint-disable */
import axios from 'axios'
axios.defaults.adapter = require('axios/lib/adapters/http')
import { Radix } from '../../radix'
import { ValidatorAddressT } from '@account'
import { firstValueFrom, interval, ReplaySubject, Subscription } from 'rxjs'
import { filter, map, switchMap, take, toArray } from 'rxjs/operators'
import {
	FinalizedTransaction,
	TransactionStateSuccess,
	TransactionStatus,
} from '../../dto/_types'
import { Amount, Network } from '@primitives'
import {
	TransactionTrackingEventType,
	KeystoreT,
	log,
	restoreDefaultLogLevel,
	AccountT,
} from '../..'
import { UInt256 } from '@radixdlt/uint256'
import { keystoreForTest, makeWalletWithFunds } from '../util'
import { Decoded, StakePositionsEndpoint } from '../../api/open-api/_types'
import { BuiltTransaction } from 'packages/application/dist'

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
		log.setLevel('INFO')
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
	// const radix = Radix.create()
	// await radix.connect(`${NODE_URL}`)

	// subs.add(
	// 	radix.__node.subscribe(
	// 		node => {
	// 			expect(node.url.host).toBe(new URL(NODE_URL).host)
	// 			done()
	// 		},
	// 		error => done(error),
	// 	),
	// )
	// })

	it('can switch networks', async () => {
		const radix = Radix.create()

		await radix
			.login(keystoreForTest.password, loadKeystore)
			.connect(`${NODE_URL}`)

		const address1 = await firstValueFrom(radix.activeAddress)
		expect(address1.network).toBeDefined()

		await radix.connect('https://mainnet-gateway.radixdlt.com')

		const address2 = await firstValueFrom(radix.activeAddress)
		expect(address2.network).toBeDefined()

		await radix.connect('https://stokenet-gateway.radixdlt.com')

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
	it('should compare token balance before and after transfer', async () => {
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

		const tokenBalancesBefore = (
			await radix.tokenBalances()
		)._unsafeUnwrap()

		const initialBalance = getXRDBalanceOrZero(tokenBalancesBefore)

		const transferTokens = (
			await radix.transferTokens(
				accounts[2].address,
				amountToSend,
				nativeTokenBalance.token_identifier.rri,
			)
		)._unsafeUnwrap()

		const txID = await firstValueFrom(transferTokens.completion)

		const txStatus = (
			await (await radix.api()).transactionStatus(txID, network)
		)._unsafeUnwrap()

		const tokenBalancesAfter = (await radix.tokenBalances())._unsafeUnwrap()

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

	*/

	it('should be able to get transaction history', async () => {
		const amountToSend = Amount.fromUnsafe(
			`1${'0'.repeat(18)}`,
		)._unsafeUnwrap()

		const tx1 = (
			await radix.transferTokens(
				accounts[2].address,
				amountToSend,
				nativeTokenBalance.token_identifier.rri,
			)
		)._unsafeUnwrap()

		const tx2 = (
			await radix.transferTokens(
				accounts[2].address,
				amountToSend,
				nativeTokenBalance.token_identifier.rri,
			)
		)._unsafeUnwrap()

		const [txID1, txID2] = await Promise.all([
			firstValueFrom(tx1.completion),
			firstValueFrom(tx2.completion),
		])

		const txHistory = (await radix.transactionHistory(2))._unsafeUnwrap()

		expect(txHistory.transactions[0].txID.equals(txID1))
		expect(txHistory.transactions[1].txID.equals(txID2))
	})

	// 🟢
	it('should handle transaction status updates', done => {
		const amountToSend = Amount.fromUnsafe(
			`1${'0'.repeat(18)}`,
		)._unsafeUnwrap()

		radix
			.transferTokens(
				accounts[2].address,
				amountToSend,
				nativeTokenBalance.token_identifier.rri,
			)
			.then(res => {
				res._unsafeUnwrap()
					.events.pipe(
						filter(
							event =>
								event.eventUpdateType ===
								TransactionTrackingEventType.FINALIZED,
						),
						map(
							event =>
								(
									event as TransactionStateSuccess<FinalizedTransaction>
								).transactionState.txID,
						),
						switchMap(txID =>
							radix.transactionStatus(txID, interval(1000)),
						),
						map(tx => tx.status),
						take(2),
						toArray(),
					)
					.subscribe(statuses => {
						expect([
							TransactionStatus.PENDING,
							TransactionStatus.CONFIRMED,
						]).toEqual(statuses)
						done()
					})
			})
	})

	it('can lookup tx', async () => {
		const amountToSend = Amount.fromUnsafe(
			`1${'0'.repeat(18)}`,
		)._unsafeUnwrap()

		const { completion } = (
			await radix.transferTokens(
				accounts[2].address,
				amountToSend,
				nativeTokenBalance.token_identifier.rri,
			)
		)._unsafeUnwrap()

		const txID = await firstValueFrom(completion)
		const tx = (await radix.lookupTransaction(txID))._unsafeUnwrap()

		expect(txID.toPrimitive()).toEqual(tx.txID.toPrimitive())
		expect(tx.actions.length).toEqual(1)
	})

	it('can lookup validator', async () => {
		const {
			validators: [validator],
		} = (await radix.validators())._unsafeUnwrap()

		const validatorFromLookup = (
			await radix.lookupValidator(validator.address)
		)._unsafeUnwrap()

		expect(validatorFromLookup.address.equals(validator.address)).toBe(true)
	})

	it('should get validators', async () => {
		const { validators } = (await radix.validators())._unsafeUnwrap()

		expect(validators.length).toBeGreaterThan(0)
	})

	const getValidators = async () =>
		(await radix.validators())._unsafeUnwrap().validators

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

	it('can fetch stake positions', async () => {
		const validators = await getValidators()

		const validator = validators.find(v => v.isExternalStakeAccepted)

		if (!validator) {
			throw new Error(`no validator has 'isExternalStakeAccepted'`)
		}

		const initialStake = getValidatorStakeAmountForAddress(
			(await radix.stakingPositions())._unsafeUnwrap(),
			validator.address,
		)

		const stakeAmount = Amount.fromUnsafe(
			`90${'0'.repeat(18)}`,
		)._unsafeUnwrap()

		const { completion } = (
			await radix.stakeTokens(validator.address, stakeAmount)
		)._unsafeUnwrap()

		await firstValueFrom(completion)

		const actualStake = getValidatorStakeAmountForAddress(
			(await radix.stakingPositions())._unsafeUnwrap(),
			validator.address,
		).toString()

		const expectedStake = initialStake.add(stakeAmount).toString()

		expect(actualStake).toEqual(expectedStake)
	})

	it.only('can fetch unstake positions', async () => {
		const validators = await getValidators()

		const validator = validators.find(v => v.isExternalStakeAccepted)

		if (!validator) {
			throw new Error(`no validator has 'isExternalStakeAccepted'`)
		}

		const stakeAmount = Amount.fromUnsafe(
			`90${'0'.repeat(18)}`,
		)._unsafeUnwrap()

		const { completion } = (
			await radix.stakeTokens(validator.address, stakeAmount)
		)._unsafeUnwrap()

		await firstValueFrom(completion)

		const unstake = (
			await radix.unstakeTokens(validator.address, stakeAmount)
		)._unsafeUnwrap()

		await firstValueFrom(unstake.completion)

		const positions = (await radix.unstakingPositions())._unsafeUnwrap()

		expect(positions.pendingUnstakes[0]).toBeDefined()
	})

	it('tx events emits expected values', done => {
		const expectedValues = [
			TransactionTrackingEventType.INITIATED,
			TransactionTrackingEventType.BUILT,
			TransactionTrackingEventType.CONFIRMED,
			TransactionTrackingEventType.SIGNED,
			TransactionTrackingEventType.FINALIZED,
			TransactionTrackingEventType.SUBMITTED,
			TransactionTrackingEventType.STATUS_UPDATE,
			TransactionTrackingEventType.STATUS_UPDATE,
			TransactionTrackingEventType.COMPLETED,
		]

		const amount = Amount.fromUnsafe(`1${'0'.repeat(18)}`)._unsafeUnwrap()

		radix
			.transferTokens(
				accounts[2].address,
				amount,
				nativeTokenBalance.token_identifier.rri,
			)
			.then(result => {
				subs.add(
					result
						._unsafeUnwrap()
						.events.pipe(
							map(e => e.eventUpdateType),
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
	})
	it('tx manual confirmation', done => {
		const amount = Amount.fromUnsafe(`1${'0'.repeat(18)}`)._unsafeUnwrap()


		let hasConfirmed = false

		const userConfirmation = async (confirm: () => void, reject: () => void, tx: BuiltTransaction) => {
			confirm()
			hasConfirmed = true
		}

		radix
			.transferTokens(
				accounts[2].address,
				amount,
				nativeTokenBalance.token_identifier.rri,
				undefined,
				{ userConfirmation },
			)
			.then(result => {
				result._unsafeUnwrap().completion.subscribe(() => {
					expect(hasConfirmed).toBeTruthy()
					done()
				})
			})
	})
})
