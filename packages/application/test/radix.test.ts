import { Radix } from '../src/radix'
import {
	Address,
	AddressT,
	HDMasterSeed,
	Wallet,
	WalletT,
} from '@radixdlt/account'
import { interval, Observable, of, Subscription, throwError } from 'rxjs'
import { map, take, toArray } from 'rxjs/operators'
import { KeystoreT } from '@radixdlt/crypto'
import { RadixT } from '../src/_types'
import { APIErrorCause, ErrorCategory } from '../src/errors'
import { balancesFor, mockedAPI, mockRadixCoreAPI } from './mockRadix'
import { NodeT, RadixCoreAPI } from '../src/api/_types'
import {
	TokenBalances,
	TransactionIdentifierT,
	TransactionStatus,
} from '../src/dto/_types'
import { TransactionIdentifier } from '../src/dto/transactionIdentifier'
import { Amount, AmountT } from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'
import { signatureFromHexStrings } from '@radixdlt/crypto/test/ellipticCurveCryptography.test'
import { ActionType } from '../src/actions/_types'
import { v4 as uuidv4 } from 'uuid'
import { StakeTokensAction } from '../src/actions/stakeTokensAction'

const createWallet = (): WalletT => {
	const masterSeed = HDMasterSeed.fromSeed(
		Buffer.from('deadbeef'.repeat(8), 'hex'),
	)
	return Wallet.create({ masterSeed })
}

const dummyNode = (urlString: string): Observable<NodeT> =>
	of({
		url: new URL(urlString),
	})

export type KeystoreForTest = {
	keystore: KeystoreT
	password: string
	expectedSecret: string
	publicKeysCompressed: string[]
}

export const keystoreForTest: KeystoreForTest = {
	password: 'my super strong passaword',
	expectedSecret:
		'920075470afdd45c9cb6286593abc6c98b1d25d4d2e3f2d547d4f389f153c8c5916a0857fd6d404e3089cb745594332b1307f46e43ad2357da20935318917063',
	keystore: {
		crypto: {
			cipher: 'AES-GCM',
			cipherparams: {
				nonce: 'dc7946168a78da825b3a7f73',
			},
			ciphertext:
				'280c07cd1a7b0d5a7adfd869ff80bc45a97b569be11345d5d15d01d692287d6ef566998fd786965735bba540e5d1df2c482c75e08d1355f09cb47af02c725df4',
			kdf: 'scrypt',
			kdfparams: {
				costParameterN: 8192,
				costParameterC: 262144,
				blockSize: 8,
				parallelizationParameter: 1,
				lengthOfDerivedKey: 32,
				salt:
					'de8db8d11cba474c0e78c76327463e48bf1d5e1cb59c9ab76cc6b1145827efca',
			},
			mac: '966bbc6ad90828010d637ded6206ad9a',
		},
		id: 'a7c80442-1e50-4166-9f26-dcc5548a865d',
		version: 1,
	},
	// 1. input seed at https://iancoleman.io/bip39/
	// 2. change to BIP32 and enter derivation path: m/44'/536'/0'/0
	// 3. Check 'use hardened addresses' checkbox
	// 4. Copy Private Key from table which is on WIF format
	// 5. Paste Private Key WIF in https://www.bitaddress.org
	// 6. Copy paste compressed public key (and lower case it)
	publicKeysCompressed: [
		'035fd56ba4a14b44ea6c895fa9ac59c5a47d8ffd1b068a520146499cb6fe9df58a',
		'0248e961ee2379940d8c1fd44422521b17dc426df37b9cec274f608e63744b358f',
		'028bae51f118a3fe61c26c43cd472e0e1f6448eb9ce873d7e8859600beb7d401b4',
		'031c0641530a7755bdd4ba3232ae94c54febcfe4c68c3ae2684d9308ab60f639ab',
		'02bbef7faf40ac19c0878a1d5cf9f8df3398934c10410bb280f78929c182c406f0',
		'03fed9646bd8612fa43d3d873ec1ba67665e257c04830b9ac91e58d20662a0d623',
	],
}

describe('Radix API', () => {
	it('can be created empty', () => {
		const radix = Radix.create()
		expect(radix).toBeDefined()
	})

	it('can connect and is chainable', () => {
		const radix = Radix.create().connect(new URL('http://www.my.node.com'))
		expect(radix).toBeDefined()
		expect(radix.ledger.nativeToken).toBeDefined()
		expect(radix.ledger.tokenBalancesForAddress).toBeDefined() // etc
	})

	it('emits node connection without wallet', async (done) => {
		const radix = Radix.create()
		radix.__withAPI(mockedAPI)

		radix.__node.subscribe(
			(node) => {
				expect(node.url.host).toBe('www.example.com')
				done()
			},
			(error) => done(error),
		)
	})

	const testChangeNode = async (
		expectedValues: string[],
		done: jest.DoneCallback,
		emitNewValues: (radix: RadixT) => void,
	): Promise<void> => {
		const radix = Radix.create()

		radix.__node
			.pipe(
				map((n: NodeT) => n.url.toString()),
				take(2),
				toArray(),
			)
			.subscribe(
				(nodes) => {
					expect(nodes).toStrictEqual(expectedValues)
					done()
				},
				(error) => done(error),
			)

		emitNewValues(radix)
	}

	it('can change node with nodeConnection', async (done) => {
		const n1 = 'http://www.node1.com/'
		const n2 = 'http://www.node2.com/'

		await testChangeNode([n1, n2], done, (radix: RadixT) => {
			radix.withNodeConnection(dummyNode(n1))
			radix.withNodeConnection(dummyNode(n2))
		})
	})

	it('can change node with url', async (done) => {
		const n1 = 'http://www.node1.com/'
		const n2 = 'http://www.node2.com/'

		await testChangeNode([n1, n2], done, (radix: RadixT) => {
			radix.connect(new URL(n1))
			radix.connect(new URL(n2))
		})
	})

	it('can change api', async (done) => {
		const n1 = 'http://www.node1.com/'
		const n2 = 'http://www.node2.com/'

		await testChangeNode([n1, n2], done, (radix: RadixT) => {
			radix.__withAPI(of(mockRadixCoreAPI({ nodeUrl: n1 })))
			radix.__withAPI(of(mockRadixCoreAPI({ nodeUrl: n2 })))
		})
	})

	it('can observe active account without API', async (done) => {
		const radix = Radix.create()
		const wallet = createWallet()
		radix.withWallet(wallet)

		radix.activeAccount.subscribe(
			(account) => {
				expect(account.hdPath.addressIndex.value()).toBe(0)
				done()
			},
			(error) => done(error),
		)
	})

	it('provides magic for wallets', async (done) => {
		const radix = Radix.create()
		const wallet = createWallet()
		radix.withWallet(wallet)
		radix.__withAPI(mockedAPI)

		radix.activeAddress.subscribe(
			(address) => {
				expect(address.magicByte).toBe(123)
				done()
			},
			(error) => done(error),
		)
	})

	it('returns native token without wallet', async (done) => {
		const radix = Radix.create()
		radix.__withAPI(mockedAPI)

		radix.ledger.nativeToken().subscribe(
			(token) => {
				expect(token.symbol).toBe('XRD')
				done()
			},
			(error) => done(error),
		)
	})

	it('should be able to detect errors', (done) => {
		const invalidURLErrorMsg = 'invalid url'
		const failingNode: Observable<NodeT> = throwError(() => {
			return new Error(invalidURLErrorMsg)
		})

		const subs = new Subscription()

		const radix = Radix.create()

		radix.__node
			.subscribe((n) => {
				done(new Error('Expected error but did not get any'))
			})
			.add(subs)

		radix.errors
			.subscribe({
				next: (error) => {
					expect(error.category).toEqual(ErrorCategory.NODE)
					done()
				},
			})
			.add(subs)

		radix.withNodeConnection(failingNode)
	})

	it('login with wallet', async (done) => {
		const radix = Radix.create()
		radix.__wallet.subscribe(
			(wallet: WalletT) => {
				const account = wallet.__unsafeGetAccount()
				expect(account.hdPath.addressIndex.value()).toBe(0)
				account.derivePublicKey().subscribe(
					(pubKey) => {
						expect(pubKey.toString(true)).toBe(
							keystoreForTest.publicKeysCompressed[0],
						)
						done()
					},
					(error) => done(error),
				)
			},
			(e) => done(e),
		)

		const loadKeystore = (): Promise<KeystoreT> =>
			Promise.resolve(keystoreForTest.keystore)

		radix.login(keystoreForTest.password, loadKeystore)
	})

	it('should handle wallet error', (done) => {
		const radix = Radix.create()

		radix.__wallet.subscribe((wallet: WalletT) => {
			const account = wallet.__unsafeGetAccount()
			expect(account.hdPath.addressIndex.value()).toBe(0)
			account.derivePublicKey().subscribe(
				(pubKey) => {
					expect(pubKey.toString(true)).toBe(
						keystoreForTest.publicKeysCompressed[0],
					)
					done()
				},
				(error) => done(error),
			)
		})

		radix.errors.subscribe({
			next: (error) => {
				expect(error.category).toEqual(ErrorCategory.WALLET)
			},
		})

		const loadKeystoreError = (): Promise<KeystoreT> =>
			Promise.reject('Error!')

		const loadKeystoreSuccess = (): Promise<KeystoreT> =>
			Promise.resolve(keystoreForTest.keystore)

		radix.login(keystoreForTest.password, loadKeystoreError)
		radix.login(keystoreForTest.password, loadKeystoreSuccess)
	})

	it('radix can derive accounts', async (done) => {
		const subs = new Subscription()
		const radix = Radix.create()

		radix.activeAccount
			.pipe(
				map((a) => a.hdPath.addressIndex.value()),
				take(2),
				toArray(),
			)
			.subscribe(
				(accounts) => {
					expect(accounts).toStrictEqual([0, 2])
					done()
				},
				(e) => done(e),
			)
			.add(subs)

		radix
			.withWallet(createWallet())
			.deriveNextAccount()
			.deriveNextAccount({ alsoSwitchTo: true })
	})

	it('radix can switch to accounts', async (done) => {
		const subs = new Subscription()
		const radix = Radix.create()

		const expectedValues = [0, 1, 2, 3, 1, 0, 3]

		radix.activeAccount
			.pipe(
				map((a) => a.hdPath.addressIndex.value()),
				take(expectedValues.length),
				toArray(),
			)
			.subscribe(
				(accounts) => {
					expect(accounts).toStrictEqual(expectedValues)
					done()
				},
				(e) => done(e),
			)
			.add(subs)

		radix
			.withWallet(createWallet()) //0
			.deriveNextAccount({ alsoSwitchTo: true }) // 1
			.deriveNextAccount({ alsoSwitchTo: true }) // 2
			.deriveNextAccount({ alsoSwitchTo: true }) // 3
			.switchAccount({ toIndex: 1 })
			.switchAccount('first')
			.switchAccount('last')
	})

	it('should forward an error when calling api', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(
			of({
				...mockRadixCoreAPI(),
				tokenBalancesForAddress: () =>
					throwError(
						() =>
							new Error(
								'error that should trigger expected failure.',
							),
					),
			}),
		)

		radix.tokenBalances
			.subscribe({
				next: (_n) => {
					done(
						new Error(
							'Unexpectedly got tokenBalance, but expected error.',
						),
					)
				},
			})
			.add(subs)

		radix.errors
			.subscribe((error) => {
				expect(error.category).toEqual(ErrorCategory.API)
				expect(error.cause).toEqual(APIErrorCause.TOKEN_BALANCES_FAILED)
				done()
			})
			.add(subs)

		radix.withWallet(createWallet())
	})

	it('does not kill property observables when rpc requests fail', async (done) => {
		const subs = new Subscription()
		let amountVal = 100
		let counter = 0

		const api = of(<RadixCoreAPI>{
			...mockRadixCoreAPI(),
			tokenBalancesForAddress: (
				a: AddressT,
			): Observable<TokenBalances> => {
				if (counter > 2 && counter < 5) {
					counter++
					return throwError(() => new Error('Manual error'))
				} else {
					const observableBalance = of(balancesFor(a, amountVal))
					counter++
					amountVal += 100
					return observableBalance
				}
			},
		})

		const radix = Radix.create()
		radix.withWallet(createWallet())
		radix.__withAPI(api).withTokenBalanceFetchTrigger(interval(300))

		const expectedValues = [
			100000000000000000000,
			200000000000000000000,
			300000000000000000000,
		]

		radix.tokenBalances
			.pipe(
				map((tb) => tb.tokenBalances[0].amount.magnitude.valueOf()),
				take(expectedValues.length),
				toArray(),
			)
			.subscribe((amounts) => {
				expect(amounts).toEqual(expectedValues)
				done()
			})
			.add(subs)
	})

	it('deriveNextAccount method on radix updates accounts', (done) => {
		const subs = new Subscription()

		const radix = Radix.create()
			.withWallet(createWallet())
			.__withAPI(mockedAPI)

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
		const subs = new Subscription()

		const radix = Radix.create()
			.withWallet(createWallet())
			.__withAPI(mockedAPI)

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
		const subs = new Subscription()

		const radix = Radix.create()
			.withWallet(createWallet())
			.__withAPI(mockedAPI)

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

	it('mocked API returns different but deterministic tokenBalances per account', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

		const loadKeystore = (): Promise<KeystoreT> =>
			Promise.resolve(keystoreForTest.keystore)

		radix.login(keystoreForTest.password, loadKeystore)

		radix.__wallet
			.subscribe((_w) => {
				const expectedValues = [
					{ pkIndex: 0, tokenBalancesCount: 5 },
					{ pkIndex: 1, tokenBalancesCount: 5 },
					{ pkIndex: 2, tokenBalancesCount: 4 },
					{ pkIndex: 3, tokenBalancesCount: 4 },
					{ pkIndex: 4, tokenBalancesCount: 3 },
				]

				radix.tokenBalances
					.pipe(take(expectedValues.length), toArray())
					.subscribe((values) => {
						values.forEach((tb, index: number) => {
							const expected = expectedValues[index]

							expect(tb.owner.publicKey.toString(true)).toBe(
								keystoreForTest.publicKeysCompressed[
									expected.pkIndex
								],
							)
							expect(tb.tokenBalances.length).toBe(
								expected.tokenBalancesCount,
							)
						})
						done()
					})
					.add(subs)

				radix.deriveNextAccount({ alsoSwitchTo: true })
				radix.deriveNextAccount({ alsoSwitchTo: true })
				radix.deriveNextAccount({ alsoSwitchTo: true })
				radix.deriveNextAccount({ alsoSwitchTo: true })
			})
			.add(subs)
	})

	it('mocked API returns different but deterministic transaction history per account', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

		const loadKeystore = (): Promise<KeystoreT> =>
			Promise.resolve(keystoreForTest.keystore)

		radix.login(keystoreForTest.password, loadKeystore)

		radix.__wallet
			.subscribe((_w) => {
				const expectedValues = [
					{ pkIndex: 0, actionsCountForEachTx: [3, 2, 2] },
					{ pkIndex: 1, actionsCountForEachTx: [1, 1, 1] },
					{ pkIndex: 2, actionsCountForEachTx: [2, 1, 2] },
				]

				radix
					.transactionHistory({ size: 3 })
					.pipe(take(expectedValues.length), toArray())
					.subscribe((values) => {
						values.forEach((txHist, index: number) => {
							const expected = expectedValues[index]

							txHist.transactions.forEach((tx) => {
								expect(tx.txID.toString().length).toBe(64)
							})

							expect(
								txHist.transactions.map(
									(tx) => tx.actions.length,
								),
							).toStrictEqual(expected.actionsCountForEachTx)
						})
						done()
					})
					.add(subs)

				radix.deriveNextAccount({ alsoSwitchTo: true })
				radix.deriveNextAccount({ alsoSwitchTo: true })
			})
			.add(subs)
	})

	it('should handle transaction status updates', (done) => {
		const radix = Radix.create().__withAPI(mockedAPI)

		const expectedValues: TransactionStatus[] = [
			TransactionStatus.PENDING,
			TransactionStatus.FAILED,
		]

		radix
			.transactionStatus(
				TransactionIdentifier.create(
					'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
				)._unsafeUnwrap(),
				interval(300),
			)
			.pipe(
				map(({ status }) => status),
				take(expectedValues.length),
				toArray(),
			)
			.subscribe((values) => {
				expect(values).toStrictEqual(expectedValues)
				done()
			})
	})

	it('can lookup tx', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

		const loadKeystore = (): Promise<KeystoreT> =>
			Promise.resolve(keystoreForTest.keystore)

		radix.login(keystoreForTest.password, loadKeystore)

		const mockedTXId = TransactionIdentifier.create(
			Buffer.from(
				'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
				'hex',
			),
		)._unsafeUnwrap()

		radix.__wallet
			.subscribe((_w) => {
				radix.ledger.lookupTransaction(mockedTXId).subscribe((tx) => {
					expect(tx.txID.equals(mockedTXId)).toBe(true)
					expect(tx.actions.length).toBeGreaterThan(0)
					done()
				})
			})
			.add(subs)
	})

	it('should get validators', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

		radix.ledger
			.validators({
				size: 10,
				cursor: '',
			})
			.subscribe((validators) => {
				expect(validators.length).toEqual(10)
				done()
			}).add(subs)
	})

	it('should get build transaction response', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

		radix.ledger
			.buildTransaction({
				actions: [
					StakeTokensAction.intended({
						validator: Address.fromBase58String(
							'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
						)._unsafeUnwrap(),
						amount: Amount.make(10000),
					}),
				],
			})
			.subscribe((unsignedTx) => {
				expect((unsignedTx as { fee: AmountT }).fee.toString()).toEqual(
					'30062',
				)
				done()
			}).add(subs)
	})

	it('should get submitSignedTransaction response', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

		radix.ledger
			.submitSignedTransaction({
				transaction: {
					blob: '',
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
					'2c4b8f4e4bc5b2502c4b8f4e4bc5b2502c4b8f4e4bc5b2502c4b8f4e4bc5b250',
				)
				done()
			}).add(subs)
	})

	it('should get network transaction demand response', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

		radix.ledger.networkTransactionDemand().subscribe((result) => {
			expect(result.tps).toEqual(109)
		}).add(subs)
	})

	it('should get network transaction throughput response', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

		radix.ledger.networkTransactionThroughput().subscribe((result) => {
			expect(result.tps).toEqual(10)
			done()
		}).add(subs)
	})

	it('can fetch stake positions', (done) => {
		const subs = new Subscription()

		const radix = Radix.create()
			.__withAPI(mockedAPI)
			.withStakingFetchTrigger(interval(100))

		const loadKeystore = (): Promise<KeystoreT> =>
			Promise.resolve(keystoreForTest.keystore)

		radix.login(keystoreForTest.password, loadKeystore)

		const expectedStakes = [91, 89, 43]
		const expectedValues = [expectedStakes, expectedStakes] // should be unchanged between updates (deterministically mocked).
		radix.__wallet
			.subscribe((_w) => {
				radix.stakingPositions
					.pipe(
						map((sp) =>
							sp.map((p) => p.amount.magnitude.valueOf() % 100),
						),
						take(expectedValues.length),
						toArray(),
					)
					.subscribe((values) => {
						expect(values).toStrictEqual(expectedValues)
						done()
					})
			})
			.add(subs)
	})

	it('can fetch unstake positions', (done) => {
		const subs = new Subscription()

		const radix = Radix.create()
			.__withAPI(mockedAPI)
			.withStakingFetchTrigger(interval(100))

		const loadKeystore = (): Promise<KeystoreT> =>
			Promise.resolve(keystoreForTest.keystore)

		radix.login(keystoreForTest.password, loadKeystore)

		const expectedStakes = [
			{ amount: 291, validator: 'oZ', epochsUntil: 42 },
			{ amount: 489, validator: 'Ld', epochsUntil: 21 },
			{ amount: 143, validator: 'RT', epochsUntil: 95 },
		]
		const expectedValues = [expectedStakes, expectedStakes] // should be unchanged between updates (deterministically mocked).
		radix.__wallet
			.subscribe((_w) => {
				radix.unstakingPositions
					.pipe(
						map((sp) =>
							sp.map((p) => ({
								amount: p.amount.magnitude.valueOf() % 1000,
								validator: p.validator.toString().slice(-2),
								epochsUntil: p.epochsUntil,
							})),
						),
						take(expectedValues.length),
						toArray(),
					)
					.subscribe((values) => {
						expect(values).toStrictEqual(expectedValues)
						done()
					})
			})
			.add(subs)
	})
})
