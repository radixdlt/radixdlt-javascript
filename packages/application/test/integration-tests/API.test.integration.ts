/**
 * @group integration
 */
import { Radix } from '../../src/radix'
import { Address, ValidatorAddress } from '@radixdlt/account'
import {
	interval,
	Observable,
	of,
	ReplaySubject,
	Subscription,
	timer,
} from 'rxjs'
import { map, take, toArray } from 'rxjs/operators'
import { KeystoreT } from '@radixdlt/crypto'
import { ManualUserConfirmTX } from '../../src/_types'
import { alice, bob } from '../../src/mockRadix'
import { NodeT } from '../../src/api/_types'
import { TransactionIdentifierT, TransactionStatus } from '../../src/dto/_types'
import { AmountT } from '@radixdlt/primitives'
import { signatureFromHexStrings } from '@radixdlt/crypto/test/ellipticCurveCryptography.test'
import { TransactionIntentBuilder } from '../../src/dto/transactionIntentBuilder'
import { TransactionTrackingEventType } from '../../src/dto/_types'
import { TransferTokensInput } from '../../src/actions/_types'
import { TransferTokensOptions } from '../../src/_types'
import { makeWalletWithFunds } from '../../../account/test/wallet.test'
import { add } from 'ramda'
const fetch = require('node-fetch')

const NODE_URL = 'https://54.73.253.49'

// const requestFaucet = async (address: string) => {
//     let request = {
//         params: {
//             address
//         }
//     }
//
//     await fetch(`${NODE_URL}/faucet/request`, {
//         method: 'POST',
//         body: JSON.stringify(request),
//         headers: { 'Content-Type': 'application/json' }
//     })
// }
//

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

	it('provides magic for wallets', async (done) => {
		const radix = Radix.create()
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		radix.activeAddress
			.subscribe(
				(address) => {
					expect(address.magicByte).toBeDefined()
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

	it('tokenBalances with tokeninfo', (done) => {
		const radix = Radix.create()
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		radix.withTokenBalanceFetchTrigger(interval(300))

		radix.tokenBalances
			.subscribe((balance) => {
				expect(balance.tokenBalances[0].amount).toBeDefined()
				done()
			})
			.add(subs)
	})

	it('API returns different but deterministic transaction history per account', (done) => {
		const radix = Radix.create()
			.withWallet(makeWalletWithFunds())
			.connect(`${NODE_URL}/rpc`)

		radix.ledger
			.transactionHistory({
				address: Address.fromUnsafe(
					'JHBdgUs5fStRSyCWBShGi8PjcWF1eW31KwGJkK9NftKeTJbXcqr',
				)._unsafeUnwrap(),
				size: 3,
			})
			.subscribe((txHistory) => {
				expect(txHistory.transactions).toEqual([])
				done()
			})
			.add(subs)
	})

	it('should handle transaction status updates', (done) => {
		const radix = Radix.create()
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
				tokenIdentifier: `//XRD`,
			},
			userConfirmation: 'skip',
			pollTXStatusTrigger: timer(1000),
		})

		txTracking.events.subscribe((event) => {
			if (
				event.eventUpdateType === TransactionTrackingEventType.FINALIZED
			) {
				const txID: TransactionIdentifierT = (event as any)
					.transactionState.txID

				radix
					.transactionStatus(txID, interval(10))
					.subscribe((status) => {
						console.log(status)
					})
					.add(subs)
			}
		})
	})

	it.only('can lookup tx', async (done) => {
		// error with finalize
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
			pollTXStatusTrigger: timer(1000),
		})

		txTracking.events.subscribe((event) => {
			if (
				event.eventUpdateType === TransactionTrackingEventType.SUBMITTED
			) {
				const txID: TransactionIdentifierT = (event as any)
					.transactionState.txID

				radix.ledger.lookupTransaction(txID).subscribe((tx) => {
					expect(tx.txID.equals(txID)).toBe(true)
					expect(tx.actions.length).toBeGreaterThan(0)
					done()
				})
			}

			/*
        radix.__wallet
            .subscribe((_w) => {
                radix.ledger.lookupTransaction(mockedTXId).subscribe((tx) => {
                    expect(tx.txID.equals(mockedTXId)).toBe(true)
                    expect(tx.actions.length).toBeGreaterThan(0)
                    done()
                })
            })
            .add(subs)
            */
		})

		it.skip('can lookup validator', (done) => {
			// not implemented in core
			const radix = Radix.create()
				.withWallet(makeWalletWithFunds())
				.connect(`${NODE_URL}/rpc`)

			const mockedValidatorAddr = ValidatorAddress.fromUnsafe(
				'validator_address_mocked',
			)._unsafeUnwrap()

			radix.__wallet
				.subscribe((_w) => {
					radix.ledger
						.lookupValidator(mockedValidatorAddr)
						.subscribe((validator) => {
							expect(
								validator.address.equals(mockedValidatorAddr),
							).toBe(true)
							expect(
								validator.ownerAddress.toString().slice(-4),
							).toBe('D9Rb')
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

		it.skip('should get build transaction response', (done) => {
			// needs fix to handle arrays params
			const radix = Radix.create()
				.withWallet(makeWalletWithFunds())
				.connect(`${NODE_URL}/rpc`)

			const transactionIntent = TransactionIntentBuilder.create()
				.stakeTokens({
					validator:
						'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
					amount: 10000,
				})
				.__syncBuildDoNotEncryptMessageIfAny(alice)
				._unsafeUnwrap()

			radix.ledger
				.buildTransaction(transactionIntent)
				.subscribe((unsignedTx) => {
					expect(
						(unsignedTx as { fee: AmountT }).fee.toString(),
					).toEqual('40294')
					done()
				})
				.add(subs)
		})

		it.skip('should get finalizeTransaction response', (done) => {
			// not implemented in core
			const radix = Radix.create()
				.withWallet(makeWalletWithFunds())
				.connect(`${NODE_URL}/rpc`)

			radix.ledger
				.finalizeTransaction({
					publicKeyOfSigner: alice.publicKey,
					transaction: {
						blob: 'xyz',
						hashOfBlobToSign: 'deadbeef',
					},
					signature: signatureFromHexStrings({
						r:
							'934b1ea10a4b3c1757e2b0c017d0b6143ce3c9a7e6a4a49860d7a6ab210ee3d8',
						s:
							'2442ce9d2b916064108014783e923ec36b49743e2ffa1c4496f01a512aafd9e5',
					}),
				})
				.subscribe((pendingTx) => {
					expect(
						(pendingTx as {
							txID: TransactionIdentifierT
						}).txID.toString(),
					).toEqual(
						'3608bca1e44ea6c4d268eb6db02260269892c0b42b86bbf1e77a6fa16c3c9282',
					)
					done()
				})
				.add(subs)
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
				.withStakingFetchTrigger(interval(100))

			radix.stakingPositions
				.pipe(
					map((sp) =>
						sp.map((p) => p.amount.magnitude.valueOf() % 100),
					),
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
				.withStakingFetchTrigger(interval(100))

			// radix.unstakingPositions
			// 	.pipe(
			// 		map((sp) =>
			// 			sp.map((p) => ({
			// 				amount: p.amount.magnitude.valueOf() % 1000,
			// 				validator: p.validator.toString().slice(-2),
			// 				epochsUntil: p.epochsUntil,
			// 			})),
			// 		),
			// 		take(expectedValues.length),
			// 		toArray(),
			// 	)
			// 	.subscribe((values) => {
			// 		expect(values).toStrictEqual(expectedValues)
			// 		done()
			// 	})
		})

		describe.skip('make tx single transfer', () => {
			// needs fix to handle arrays params
			const tokenTransferInput: TransferTokensInput = {
				to: bob,
				amount: 1,
				tokenIdentifier:
					'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/XRD',
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
				pollTXStatusTrigger = interval(50)
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

				// Store these values in a way that vue can read and write to it
				//@ts-ignore
				let transaction
				//@ts-ignore
				let userHasBeenAskedToConfirmTX

				const confirmTransaction = () => {
					// Check that pin is valid
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
						// Opens a modal where the user clicks 'confirm'
						//@ts-ignore
						transaction = txn
						shouldShowConfirmation()
						// If I just call txn.confirm() it works but the user has no input
						// txn.confirm()
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

			it('should be able to call stake tokens', (done) => {
				const radix = Radix.create()
					.withWallet(makeWalletWithFunds())
					.connect(`${NODE_URL}/rpc`)

				radix
					.stakeTokens({
						stakeInput: {
							amount: 1,
							validator:
								'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
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

			it('should be able to call unstake tokens', (done) => {
				const radix = Radix.create()
					.withWallet(makeWalletWithFunds())
					.connect(`${NODE_URL}/rpc`)

				radix
					.unstakeTokens({
						unstakeInput: {
							amount: 1,
							validator:
								'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
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
