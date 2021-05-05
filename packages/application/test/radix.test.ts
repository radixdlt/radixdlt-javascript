import {
	AccountAddress,
	AccountAddressT,
	HDMasterSeed,
	NetworkT,
	ResourceIdentifier,
	toObservable,
	ValidatorAddress,
	SigningKeychain,
} from '@radixdlt/account'
import {
	interval,
	Observable,
	of,
	ReplaySubject,
	Subscription,
	throwError,
} from 'rxjs'
import {
	map,
	mergeMap,
	shareReplay,
	skipWhile,
	take,
	tap,
	toArray,
} from 'rxjs/operators'
import {
	KeystoreT,
	MessageEncryption,
	PrivateKey,
	privateKeyFromScalar,
	PublicKey,
	publicKeyFromBytes,
} from '@radixdlt/crypto'
import {
	ActionType,
	alice,
	APIError,
	APIErrorCause,
	balancesFor,
	bob,
	BuiltTransaction,
	carol,
	ErrorCategory,
	ErrorCause,
	ExecutedTransaction,
	WalletT,
	AccountT,
	isStakeTokensAction,
	isTransferTokensAction,
	isUnstakeTokensAction,
	ManualUserConfirmTX,
	mockedAPI,
	mockRadixCoreAPI,
	NodeT,
	Radix,
	RadixCoreAPI,
	RadixT,
	SimpleTokenBalances,
	TokenBalances,
	TransactionIdentifier,
	TransactionIdentifierT,
	TransactionIntentBuilder,
	TransactionStatus,
	TransactionTrackingEventType,
	TransactionType,
	TransferTokensInput,
	TransferTokensOptions,
	Wallet,
} from '../src'
import { Amount, AmountT } from '@radixdlt/primitives'

import {
	log,
	LogLevel,
	msgFromError,
	restoreDefaultLogLevel,
} from '@radixdlt/util'
import { mockErrorMsg } from '../../util/test/util'
import {
	ExecutedAction,
	ExecutedStakeTokensAction,
	ExecutedTransferTokensAction,
	ExecutedUnstakeTokensAction,
	IntendedAction,
	SimpleExecutedTransaction,
	TransactionIntent,
} from '..'
import { signatureFromHexStrings } from '@radixdlt/crypto/test/utils'
import { makeSigningKeyChainWithFunds } from '@radixdlt/account/test/utils'
import { UInt256 } from '@radixdlt/uint256'
import { createWallet } from './util'

export const makeWalletWithFunds = (): WalletT => {
	return Wallet.create({
		signingKeychain: makeSigningKeyChainWithFunds(),
		network: NetworkT.BETANET,
	})
}

const mockTransformIntentToExecutedTX = (
	txIntent: TransactionIntent,
): SimpleExecutedTransaction => {
	const txID = TransactionIdentifier.create(
		'deadbeef'.repeat(8),
	)._unsafeUnwrap()

	const mockTransformIntendedActionToExecutedAction = (
		intendedAction: IntendedAction,
	): ExecutedAction => {
		if (isTransferTokensAction(intendedAction)) {
			const tokenTransfer: ExecutedTransferTokensAction = {
				...intendedAction,
				rri: intendedAction.rri,
			}
			return tokenTransfer
		} else if (isStakeTokensAction(intendedAction)) {
			const stake: ExecutedStakeTokensAction = {
				...intendedAction,
			}
			return stake
		} else if (isUnstakeTokensAction(intendedAction)) {
			const unstake: ExecutedUnstakeTokensAction = {
				...intendedAction,
			}
			return unstake
		} else {
			throw new Error('Missed some action type...')
		}
	}

	const msg = txIntent.message

	if (!msg) {
		log.info(`TX intent contains no message.`)
	}

	const executedTx: SimpleExecutedTransaction = {
		txID,
		sentAt: new Date(Date.now()),
		fee: Amount.fromUnsafe(1)._unsafeUnwrap(),
		message: msg?.toString('hex'),
		actions: txIntent.actions.map(
			mockTransformIntendedActionToExecutedAction,
		),
	}

	if (executedTx.message) {
		log.info(`Mocked executed TX contains a message.`)
	}

	return executedTx
}

const dummyNode = (urlString: string): Observable<NodeT> =>
	of({
		url: new URL(urlString),
	})

export type KeystoreForTest = {
	keystore: KeystoreT
	password: string
	expectedSecret: string
	expectedMnemonicPhrase: string
	publicKeysCompressed: string[]
}

export const keystoreForTest: KeystoreForTest = {
	password: 'my super strong passaword',
	expectedMnemonicPhrase:
		'legal winner thank year wave sausage worth useful legal winner thank yellow',
	expectedSecret: '7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f',
	keystore: {
		crypto: {
			cipher: 'AES-GCM',
			cipherparams: {
				nonce: 'd82fd275598b9b288b8c376d',
			},
			ciphertext: '208e520802bd17d7a569333df41dfd2d',
			kdf: 'scrypt',
			kdfparams: {
				costParameterN: 8192,
				costParameterC: 262144,
				blockSize: 8,
				parallelizationParameter: 1,
				lengthOfDerivedKey: 32,
				salt:
					'cb2227c6782493df3e822c9f6cd1131dea14e135751215d66f48227383b80acd',
			},
			mac: '68bc72c6a6a89c7fe4eb5fda4f4163e0',
		},
		id: 'b34999409a491037',
		version: 1,
	},
	// 1. input seed at https://iancoleman.io/bip39/
	// 2. change to BIP32 and enter derivation path: m/44'/536'/0'/0
	// 3. Check 'use hardened addresses' checkbox
	// 4. Copy Public Key from table
	publicKeysCompressed: [
		'03df4d988d2d0dcd61718a8a443ad457722a7eab4614a97bd9aefc8170a2b1329f',
		'0323f9ae3e9d8065a03c32480017fdbdb95622050c058f16c5c3ed897451654ed2',
		'038fa13602d11511870600a38076f2c1acc1cfc294337bdbfa38f68b3b41a2040f',
		'0398b922a1a6a324ed34e874f561e98323379078408cebddb6fd84fc46d350568e',
		'0255ea4081fe32854c15a4c1b1d308e3e5e9290645ec6981c64500d6a2f6d41767',
		'02d42d80130d68f10318f850156a35c135f212dbee07e1001363388a2e2b7c7a4d',
	],
}

describe('radix_high_level_api', () => {
	it('can load test keystore', async (done) => {
		// keystoreForTest
		await SigningKeychain.byLoadingAndDecryptingKeystore({
			password: keystoreForTest.password,
			load: () => Promise.resolve(keystoreForTest.keystore),
		}).match(
			(signingKeychain) => {
				const revealedMnemonic = signingKeychain.revealMnemonic()
				expect(revealedMnemonic.phrase).toBe(
					'legal winner thank year wave sausage worth useful legal winner thank yellow',
				)
				expect(revealedMnemonic.entropy.toString('hex')).toBe(
					'7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f',
				)
				const masterSeed = HDMasterSeed.fromMnemonic({
					mnemonic: revealedMnemonic,
				})
				expect(masterSeed.seed.toString('hex')).toBe(
					'878386efb78845b3355bd15ea4d39ef97d179cb712b77d5c12b6be415fffeffe5f377ba02bf3f8544ab800b955e51fbff09828f682052a20faa6addbbddfb096',
				)
				done()
			},
			(error) => {
				done(error)
			},
		)
	})
	it('can be created empty', () => {
		const radix = Radix.create()
		expect(radix).toBeDefined()
	})

	it('emits node connection without signingKeychain', async (done) => {
		const radix = Radix.create()
		radix.__withAPI(mockedAPI)

		radix.__node.subscribe(
			(node) => {
				expect(node.url.host).toBe('www.radixdlt.com')
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
		const n1 = 'https://www.rewards.radixtokens.com/'
		const n2 = 'https://www.radixdlt.com/'

		await testChangeNode([n1, n2], done, (radix: RadixT) => {
			radix.withNodeConnection(dummyNode(n1))
			radix.withNodeConnection(dummyNode(n2))
		})
	})

	it('can_change_node_connection', async (done) => {
		const n1 = 'https://www.rewards.radixtokens.com/'
		const n2 = 'https://www.radixdlt.com/'

		await testChangeNode([n1, n2], done, (radix: RadixT) => {
			radix.connect(n1)
			radix.connect(n2)
		})
	})

	it('can change node to connect to', async (done) => {
		const n1 = 'https://www.rewards.radixtokens.com/'
		const n2 = 'https://www.radixdlt.com/'

		await testChangeNode([n1, n2], done, (radix: RadixT) => {
			radix.__withAPI(of(mockRadixCoreAPI({ nodeUrl: n1 })))
			radix.__withAPI(of(mockRadixCoreAPI({ nodeUrl: n2 })))
		})
	})

	it('can observe active account without API', async (done) => {
		const radix = Radix.create()
		const wallet = createWallet({ startWithAnSigningKey: true })
		radix.withWallet(wallet)

		radix.activeAccount.subscribe(
			(account) => {
				expect(account.hdPath!.addressIndex.value()).toBe(0)
				done()
			},
			(error) => done(error),
		)
	})

	it('radix can restoreSigningKeysUpToIndex', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().withWallet(
			createWallet({ startWithAnSigningKey: false }),
		)

		const index = 3
		subs.add(
			radix
				.restoreLocalHDAccountsToIndex(index)
				.subscribe(
					(accounts) => {
						expect(accounts.size()).toBe(index)
						accounts.all.forEach((account: AccountT, idx) => {
							expect(account.hdPath!.addressIndex.value()).toBe(
								idx,
							)
						})
						done()
					},
					(e: Error) => {
						done(e)
					},
				),
		)
	})

	it('provides networkId for wallets', async (done) => {
		const radix = Radix.create()
		const wallet = createWallet()
		radix.withWallet(wallet)
		radix.__withAPI(mockedAPI)

		radix.activeAddress.subscribe(
			(address) => {
				expect(address.network).toBe(NetworkT.BETANET)
				done()
			},
			(error) => done(error),
		)
	})

	it('returns native token without signingKeychain', async (done) => {
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

		subs.add(
			radix.__node.subscribe((n) => {
				done(new Error('Expected error but did not get any'))
			}),
		)

		subs.add(
			radix.errors.subscribe({
				next: (error) => {
					expect(error.category).toEqual(ErrorCategory.NODE)
					done()
				},
			}),
		)

		radix.withNodeConnection(failingNode)
	})

	it('login_with_keystore', async (done) => {
		const radix = Radix.create()
		radix.__wallet.subscribe(
			(im: WalletT) => {
				const account = im.__unsafeGetAccount()
				expect(account.hdPath!.addressIndex.value()).toBe(0)
				expect(account.publicKey.toString(true)).toBe(
					keystoreForTest.publicKeysCompressed[0],
				)
				done()
			},
			(e) => done(e),
		)

		const loadKeystore = (): Promise<KeystoreT> =>
			Promise.resolve(keystoreForTest.keystore)

		radix.login(keystoreForTest.password, loadKeystore)
	})

	it('radix can reveal mnemonic', (done) => {
		const subs = new Subscription()

		const radix = Radix.create()

		subs.add(
			radix.revealMnemonic().subscribe(
				(m) => {
					expect(m.phrase).toBe(
						keystoreForTest.expectedMnemonicPhrase,
					)
					done()
				},
				(e) => {
					done(e)
				},
			),
		)

		radix.login(keystoreForTest.password, () =>
			Promise.resolve(keystoreForTest.keystore),
		)
	})

	describe('radix_api_failing_scenarios', () => {
		beforeAll(() => {
			log.setLevel('silent')
		})

		afterAll(() => {
			restoreDefaultLogLevel()
		})

		it('should handle signingKeychain error', (done) => {
			const subs = new Subscription()
			const radix = Radix.create()

			let haveSeenError = false

			subs.add(
				radix.__wallet.subscribe(
					(wallet: WalletT) => {
						const account = wallet.__unsafeGetAccount()
						expect(account.hdPath!.addressIndex.value()).toBe(0)

						expect(account.publicKey.toString(true)).toBe(
							keystoreForTest.publicKeysCompressed[0],
						)

						expect(haveSeenError).toBe(true)
						done()
					},
					(error) => done(error),
				),
			)

			subs.add(
				radix.errors.subscribe({
					next: (error) => {
						haveSeenError = true
						expect(error.category).toEqual(ErrorCategory.WALLET)
					},
				}),
			)

			const errMsg = mockErrorMsg('LoadError')

			const loadKeystoreError = (): Promise<KeystoreT> =>
				Promise.reject(new Error(errMsg))

			const loadKeystoreSuccess = (): Promise<KeystoreT> =>
				Promise.resolve(keystoreForTest.keystore)

			radix.login(keystoreForTest.password, loadKeystoreError)
			radix.login(keystoreForTest.password, loadKeystoreSuccess)
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

			subs.add(
				radix.tokenBalances.subscribe({
					next: (_n) => {
						done(
							new Error(
								'Unexpectedly got tokenBalance, but expected error.',
							),
						)
					},
				}),
			)
			subs.add(
				radix.errors.subscribe((error) => {
					expect(error.category).toEqual(ErrorCategory.API)
					expect(error.cause).toEqual(
						APIErrorCause.TOKEN_BALANCES_FAILED,
					)
					done()
				}),
			)

			radix.withWallet(createWallet())
		})

		it('does not kill property observables when rpc requests fail', async (done) => {
			const subs = new Subscription()
			let amountVal = 100
			let counter = 0

			const api = of(<RadixCoreAPI>{
				...mockRadixCoreAPI(),
				tokenBalancesForAddress: (
					a: AccountAddressT,
				): Observable<SimpleTokenBalances> => {
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
			radix.__withAPI(api).withTokenBalanceFetchTrigger(interval(250))

			const expectedValues = [100, 200, 300]

			subs.add(
				radix.tokenBalances
					.pipe(
						map((tb) => tb.tokenBalances[0].amount.valueOf()),
						take(expectedValues.length),
						toArray(),
					)
					.subscribe((amounts) => {
						expect(amounts).toEqual(expectedValues)
						done()
					}),
			)
		})
	})

	it('radix can derive accounts', async (done) => {
		const subs = new Subscription()
		const radix = Radix.create()

		subs.add(
			radix.activeAccount
				.pipe(
					map((account) => account.hdPath!.addressIndex.value()),
					take(2),
					toArray(),
				)
				.subscribe(
					(accounts) => {
						expect(accounts).toStrictEqual([0, 2])
						done()
					},
					(e) => done(e),
				),
		)

		radix
			.withWallet(createWallet())
			.deriveNextAccount()
			.deriveNextAccount({ alsoSwitchTo: true })
	})
	it('radix can switch to accounts', async (done) => {
		const subs = new Subscription()
		const radix = Radix.create()

		const expectedValues = [0, 1, 2, 3, 1, 0, 3, 0]

		subs.add(
			radix.activeAccount
				.pipe(
					map((account) => account.hdPath!.addressIndex.value()),
					take(expectedValues.length),
					toArray(),
				)
				.subscribe(
					(accounts) => {
						expect(accounts).toStrictEqual(expectedValues)
						done()
					},
					(e) => done(e),
				),
		)

		const wallet = createWallet({ startWithAnSigningKey: true })

		const firstAccount = wallet.__unsafeGetAccount()

		radix
			.withWallet(wallet) //0
			.deriveNextAccount({ alsoSwitchTo: true }) // 1
			.deriveNextAccount({ alsoSwitchTo: true }) // 2
			.deriveNextAccount({ alsoSwitchTo: true }) // 3
			.switchAccount({ toIndex: 1 })
			.switchAccount('first')
			.switchAccount('last')
			.switchAccount({ toAccount: firstAccount })
	})

	it('deriveNextAccount method on radix updates accounts', (done) => {
		const subs = new Subscription()

		const radix = Radix.create()
			.withWallet(createWallet())
			.__withAPI(mockedAPI)

		const expected = [1, 2, 3]

		subs.add(
			radix.accounts
				.pipe(
					map((i) => i.size()),
					take(expected.length),
					toArray(),
				)
				.subscribe((values) => {
					expect(values).toStrictEqual(expected)
					done()
				}),
		)

		radix.deriveNextAccount({ alsoSwitchTo: true })
		radix.deriveNextAccount({ alsoSwitchTo: false })
	})

	it('deriveNextAccount alsoSwitchTo method on radix updates activeSigningKey', (done) => {
		const subs = new Subscription()

		const radix = Radix.create()
			.withWallet(createWallet())
			.__withAPI(mockedAPI)

		const expected = [0, 1, 3]

		subs.add(
			radix.activeAccount
				.pipe(
					map((account) => account.hdPath!.addressIndex.value()),
					take(expected.length),
					toArray(),
				)
				.subscribe((values) => {
					expect(values).toStrictEqual(expected)
					done()
				}),
		)

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

		subs.add(
			radix.activeAddress
				.pipe(take(expectedCount), toArray())
				.subscribe((values) => {
					expect(values.length).toBe(expectedCount)
					done()
				}),
		)

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

		subs.add(
			radix.__wallet.subscribe((_w) => {
				const expectedValues = [
					{ pkIndex: 0, tokenBalancesCount: 3 },
					{ pkIndex: 1, tokenBalancesCount: 5 },
					{ pkIndex: 2, tokenBalancesCount: 1 },
					{ pkIndex: 3, tokenBalancesCount: 1 },
					{ pkIndex: 4, tokenBalancesCount: 4 },
				]

				subs.add(
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
						}),
				)

				radix.deriveNextAccount({ alsoSwitchTo: true })
				radix.deriveNextAccount({ alsoSwitchTo: true })
				radix.deriveNextAccount({ alsoSwitchTo: true })
				radix.deriveNextAccount({ alsoSwitchTo: true })
			}),
		)
	})

	it('tokenBalances with tokeninfo', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

		const loadKeystore = (): Promise<KeystoreT> =>
			Promise.resolve(keystoreForTest.keystore)

		radix.login(keystoreForTest.password, loadKeystore)

		subs.add(
			radix.__wallet.subscribe((_w) => {
				type ExpectedValue = { name: string; amount: string }
				const expectedValues: ExpectedValue[] = [
					{ name: 'Gold token', amount: '1533000000' },
					{ name: 'Bar token', amount: '9066000' },
					{ name: 'Rad', amount: '5060' },
				]

				subs.add(
					radix.tokenBalances
						.pipe(
							map((tbs: TokenBalances): ExpectedValue[] => {
								return tbs.tokenBalances.map(
									(bot): ExpectedValue => ({
										name: bot.token.name,
										amount: bot.amount.toString(),
									}),
								)
							}),
						)
						.subscribe((values) => {
							expect(values).toStrictEqual(expectedValues)
							done()
						}),
				)
			}),
		)
	})

	it('mocked API returns different but deterministic transaction history per account', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

		const loadKeystore = (): Promise<KeystoreT> =>
			Promise.resolve(keystoreForTest.keystore)

		radix.login(keystoreForTest.password, loadKeystore)

		subs.add(
			radix.__wallet.subscribe((_w) => {
				const expectedValues = [
					{ pkIndex: 0, actionsCountForEachTx: [1, 4, 2] },
					{ pkIndex: 1, actionsCountForEachTx: [3, 1, 1] },
					{ pkIndex: 2, actionsCountForEachTx: [1, 4, 3] },
				]

				subs.add(
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
						}),
				)

				radix.deriveNextAccount({ alsoSwitchTo: true })
				radix.deriveNextAccount({ alsoSwitchTo: true })
			}),
		)
	})

	it('should handle transaction status updates', (done) => {
		const radix = Radix.create().__withAPI(mockedAPI)

		const expectedValues: TransactionStatus[] = [
			TransactionStatus.PENDING,
			TransactionStatus.CONFIRMED,
		]

		radix
			.transactionStatus(
				TransactionIdentifier.create(
					'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
				)._unsafeUnwrap(),
				interval(10),
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

		subs.add(
			radix.__wallet.subscribe((_w) => {
				radix.ledger.lookupTransaction(mockedTXId).subscribe((tx) => {
					expect(tx.txID.equals(mockedTXId)).toBe(true)
					expect(tx.actions.length).toBeGreaterThan(0)
					done()
				})
			}),
		)
	})

	it('can lookup validator', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

		const loadKeystore = (): Promise<KeystoreT> =>
			Promise.resolve(keystoreForTest.keystore)

		radix.login(keystoreForTest.password, loadKeystore)

		const mockedValidatorAddr = ValidatorAddress.fromUnsafe(
			'vb1qvx0emaq0tua6md7wu9c047mm5krrwnlfl8c7ws3jm2s9uf4vxcyvrwrazy',
		)._unsafeUnwrap()

		subs.add(
			radix.__wallet.subscribe((_w) => {
				radix.ledger
					.lookupValidator(mockedValidatorAddr)
					.subscribe((validator) => {
						expect(
							validator.address.equals(mockedValidatorAddr),
						).toBe(true)
						expect(
							validator.ownerAddress.toString().slice(-4),
						).toBe('9gwm')
						done()
					})
			}),
		)
	})

	it('should get validators', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

		subs.add(
			radix.ledger
				.validators({
					size: 10,
					cursor: '',
				})
				.subscribe((validators) => {
					expect(validators.validators.length).toEqual(10)
					done()
				}),
		)
	})

	it('should get build transaction response', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

		const transactionIntent = TransactionIntentBuilder.create()
			.stakeTokens({
				validator:
					'vb1qvx0emaq0tua6md7wu9c047mm5krrwnlfl8c7ws3jm2s9uf4vxcyvrwrazy',
				amount: 10000,
			})
			.__syncBuildDoNotEncryptMessageIfAny(alice)
			._unsafeUnwrap()

		subs.add(
			radix.ledger
				.buildTransaction(transactionIntent)
				.subscribe((unsignedTx) => {
					expect(
						(unsignedTx as { fee: AmountT }).fee.toString(),
					).toEqual('7794')
					done()
				}),
		)
	})

	it('should get finalizeTransaction response', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

		subs.add(
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
				}),
		)
	})

	it('should get network transaction demand response', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

		subs.add(
			radix.ledger.networkTransactionDemand().subscribe((result) => {
				expect(result.tps).toEqual(109)
				done()
			}),
		)
	})

	it('should get network transaction throughput response', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

		subs.add(
			radix.ledger.networkTransactionThroughput().subscribe((result) => {
				expect(result.tps).toEqual(10)
				done()
			}),
		)
	})

	it('can fetch stake positions', (done) => {
		const subs = new Subscription()

		const radix = Radix.create()
			.__withAPI(mockedAPI)
			.withStakingFetchTrigger(interval(100))

		const loadKeystore = (): Promise<KeystoreT> =>
			Promise.resolve(keystoreForTest.keystore)

		radix.login(keystoreForTest.password, loadKeystore)

		const expectedStakes = [33, 96, 78, 5, 49]
		const expectedValues = [expectedStakes, expectedStakes] // should be unchanged between updates (deterministically mocked).
		subs.add(
			radix.__wallet.subscribe((_w) => {
				radix.stakingPositions
					.pipe(
						map((sp) => sp.map((p) => p.amount.valueOf() % 100)),
						take(expectedValues.length),
						toArray(),
					)
					.subscribe((values) => {
						expect(values).toStrictEqual(expectedValues)
						done()
					})
			}),
		)
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
			{ amount: 396, validator: 'ld', epochsUntil: 60 },
			{ amount: 878, validator: 'jq', epochsUntil: 46 },
			{ amount: 649, validator: '6t', epochsUntil: 59 },
		]
		const expectedValues = [expectedStakes, expectedStakes] // should be unchanged between updates (deterministically mocked).
		subs.add(
			radix.__wallet.subscribe((_w) => {
				radix.unstakingPositions
					.pipe(
						map((sp) =>
							sp.map((p) => ({
								amount: p.amount.valueOf() % 1000,
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
			}),
		)
	})

	it('can attach messages to transfers and skip encrypting them', async (done) => {
		const subs = new Subscription()

		let receivedMsg = 'not_set'

		const plaintext =
			'Hey Bob, this is Alice, you and I can read this message, but no one else.'

		const errNoMessage = 'found_no_message_in_tx'

		const mockedAPI = mockRadixCoreAPI()
		const radix = Radix.create()
			.withWallet(makeWalletWithFunds())
			.__withAPI(
				of({
					...mockedAPI,
					buildTransaction: (
						txIntent: TransactionIntent,
					): Observable<BuiltTransaction> => {
						receivedMsg =
							txIntent.message?.toString('utf8') ?? errNoMessage
						return mockedAPI.buildTransaction(txIntent)
					},
				}),
			)

		subs.add(
			radix
				.transferTokens({
					transferInput: {
						to: bob,
						amount: 1,
						tokenIdentifier: 'xrd_rb1qya85pwq',
					},
					userConfirmation: 'skip',
					message: { plaintext, encrypt: false },
				})
				.completion.subscribe({
					next: (_) => {
						expect(receivedMsg).toBe(plaintext)
						done()
					},
					error: (e) => {
						done(
							new Error(
								`Got error, but expected none: ${msgFromError(
									e,
								)}`,
							),
						)
					},
				}),
		)
	})

	it('can attach messages to transfers and encrypt them', async (done) => {
		const subs = new Subscription()

		let receivedMsgHex = 'not_set'

		const alicePrivateKey = privateKeyFromScalar(
			UInt256.valueOf(1),
		)._unsafeUnwrap()
		const alicePublicKey = alicePrivateKey.publicKey()
		const bobPrivateKey = privateKeyFromScalar(
			UInt256.valueOf(2),
		)._unsafeUnwrap()
		const bobPublicKey = bobPrivateKey.publicKey()
		const bob = AccountAddress.fromPublicKeyAndNetwork({
			publicKey: bobPublicKey,
			network: NetworkT.BETANET,
		})

		const plaintext =
			'Hey Bob, this is Alice, you and I can read this message, but no one else.'

		const errNoMessage = 'found_no_message_in_tx'

		const mockedAPI = mockRadixCoreAPI()
		const radix = Radix.create()
			.withWallet(makeWalletWithFunds())
			.__withAPI(
				of({
					...mockedAPI,
					buildTransaction: (
						txIntent: TransactionIntent,
					): Observable<BuiltTransaction> => {
						receivedMsgHex =
							txIntent.message?.toString('hex') ?? errNoMessage
						return mockedAPI.buildTransaction(txIntent)
					},
				}),
			)

		const transactionTracking = radix.transferTokens({
			transferInput: {
				to: bob,
				amount: 1,
				tokenIdentifier: 'xrd_rb1qya85pwq',
			},
			userConfirmation: 'skip',
			message: { plaintext, encrypt: true },
		})

		subs.add(
			transactionTracking.completion
				.pipe(
					mergeMap(
						(_): Observable<Buffer> => {
							return toObservable(
								MessageEncryption.decrypt({
									encryptedMessage: Buffer.from(
										receivedMsgHex,
										'hex',
									),
									diffieHellmanPoint: alicePrivateKey.diffieHellman.bind(
										null,
										bobPublicKey,
									),
								}),
							)
						},
					),
					tap((decryptedByAlice: Buffer) => {
						expect(decryptedByAlice.toString('utf8')).toBe(
							plaintext,
						)
					}),
					mergeMap(
						(_): Observable<Buffer> => {
							return toObservable(
								MessageEncryption.decrypt({
									encryptedMessage: Buffer.from(
										receivedMsgHex,
										'hex',
									),
									diffieHellmanPoint: bobPrivateKey.diffieHellman.bind(
										null,
										alicePublicKey,
									),
								}),
							)
						},
					),
					map((decryptedByBob: Buffer) => {
						return decryptedByBob.toString('utf8')
					}),
				)
				.subscribe({
					next: (decryptedByBob) => {
						expect(decryptedByBob).toBe(plaintext)
						done()
					},
					error: (e) => {
						done(
							new Error(
								`Got error, but expected none: ${msgFromError(
									e,
								)}`,
							),
						)
					},
				}),
		)
	})

	it('can decrypt encrypted message in transaction', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

		const loadKeystore = (): Promise<KeystoreT> =>
			Promise.resolve(keystoreForTest.keystore)

		type SystemUnderTest = {
			plaintext: string
			pkOfActiveSigningKey0: PublicKey
			pkOfActiveSigningKey1: PublicKey
			recipient: PublicKey
			tx: SimpleExecutedTransaction
			decrypted0: string
			decrypted1: string
		}

		const recipientPK = publicKeyFromBytes(
			Buffer.from(keystoreForTest.publicKeysCompressed[1], 'hex'),
		)._unsafeUnwrap()
		const recipientAddress = AccountAddress.fromPublicKeyAndNetwork({
			publicKey: recipientPK,
			network: NetworkT.BETANET,
		})
		const tokenTransferInput: TransferTokensInput = {
			to: recipientAddress,
			amount: 1,
			tokenIdentifier: 'xrd_rb1qya85pwq',
		}

		const plaintext = 'Hey Bob, this is Alice.'

		let sut: SystemUnderTest = ({
			plaintext,
			recipient: recipientPK,
		} as unknown) as SystemUnderTest

		const txIntentBuilder = TransactionIntentBuilder.create()

		// @ts-ignore
		subs.add(
			radix.__wallet
				.pipe(
					map(
						(im: WalletT): AccountT => {
							const account = im.__unsafeGetAccount()
							sut.pkOfActiveSigningKey0 = account.publicKey
							return account
						},
					),
					mergeMap(
						(account: AccountT): Observable<TransactionIntent> => {
							return txIntentBuilder
								.transferTokens(tokenTransferInput)
								.message({ plaintext, encrypt: true })
								.build({
									encryptMessageIfAnyWithAccount: of(account),
								})
						},
					),
					map(
						(
							intent: TransactionIntent,
						): SimpleExecutedTransaction =>
							mockTransformIntentToExecutedTX(intent),
					),
					tap(
						(
							tx: SimpleExecutedTransaction,
						): SimpleExecutedTransaction => {
							sut.tx = tx
							return tx
						},
					),
					mergeMap((tx) => radix.decryptTransaction(tx)),
					tap((decrypted: string) => (sut.decrypted0 = decrypted)),
					mergeMap((_) => {
						radix.deriveNextAccount({ alsoSwitchTo: true })
						return radix.activeAccount
					}),
					tap(
						(account: AccountT) =>
							(sut.pkOfActiveSigningKey1 = account.publicKey),
					),
					mergeMap((_) => radix.decryptTransaction(sut.tx)),
					tap((decrypted) => (sut.decrypted1 = decrypted)),
				)
				.subscribe({
					next: (_) => {
						expect(sut).toBeDefined()
						expect(sut.plaintext).toBeDefined()
						expect(sut.decrypted0).toBeDefined()
						expect(sut.decrypted1).toBeDefined()
						expect(sut.pkOfActiveSigningKey0).toBeDefined()
						expect(sut.pkOfActiveSigningKey1).toBeDefined()
						expect(sut.recipient).toBeDefined()
						expect(sut.tx).toBeDefined()
						expect(sut.tx.message).toBeDefined()

						expect(sut.tx.actions.length).toBe(1)
						const transferTokensAction = sut.tx
							.actions[0] as ExecutedTransferTokensAction
						expect(
							transferTokensAction.to.publicKey.equals(
								sut.recipient,
							),
						).toBe(true)

						expect(
							sut.pkOfActiveSigningKey0.equals(
								sut.pkOfActiveSigningKey1,
							),
						).toBe(false)
						expect(
							sut.pkOfActiveSigningKey1.equals(sut.recipient),
						).toBe(true)

						expect(sut.tx.message).not.toBe(sut.plaintext) // because encrypted

						expect(sut.decrypted0).toBe(sut.plaintext)
						expect(sut.decrypted1).toBe(sut.plaintext)
						expect(sut.decrypted1).toBe(sut.decrypted0)

						done()
					},
					error: (error) => {
						const errMsg = msgFromError(error)
						done(new Error(errMsg))
					},
				}),
		)

		radix.login(keystoreForTest.password, loadKeystore)
	})

	it('should be able to handle error on API call', (done) => {
		const subs = new Subscription()
		const errorMsg = 'failed to fetch native token'

		const radix = Radix.create()
			.withWallet(createWallet())
			.__withAPI(
				of({
					...mockRadixCoreAPI(),
					nativeToken: () => {
						throw Error(errorMsg)
					},
				}),
			)

		subs.add(
			radix.ledger.nativeToken().subscribe({
				next: (token) => {
					done(Error('Should throw'))
				},
				error: (e: APIError) => {
					expect(e.errors.length).toEqual(1)
					expect(e.errors[0].message).toEqual(errorMsg)
					done()
				},
			}),
		)
	})

	describe('make tx single transfer', () => {
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
			pollTXStatusTrigger = interval(50)
		})

		afterEach(() => {
			subs.unsubscribe()
		})

		it('events emits expected values', (done) => {
			const radix = Radix.create()
				.withWallet(createWallet())
				.__withAPI(mockedAPI)

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
					}),
			)
		})

		it('automatic confirmation', (done) => {
			const radix = Radix.create()
				.withWallet(createWallet())
				.__withAPI(mockedAPI)

			let gotTXId = false

			subs.add(
				radix.transferTokens(transferTokens()).completion.subscribe({
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
				}),
			)
		})

		it('radix_tx_manual_confirmation', (done) => {
			const radix = Radix.create()
				.withWallet(createWallet())
				.__withAPI(mockedAPI)

			const userConfirmation = new ReplaySubject<ManualUserConfirmTX>()

			const transactionTracking = radix.transferTokens({
				...transferTokens(),
				userConfirmation,
			})

			let userHasBeenAskedToConfirmTX = false

			subs.add(
				userConfirmation.subscribe((confirmation) => {
					userHasBeenAskedToConfirmTX = true
					confirmation.confirm()
				}),
			)

			subs.add(
				transactionTracking.completion.subscribe({
					next: (_txID) => {
						expect(userHasBeenAskedToConfirmTX).toBe(true)
						done()
					},
					error: (e) => {
						done(e)
					},
				}),
			)
		})

		it('should not emit sign tx event when switching accounts', (done) => {
			const radix = Radix.create()
				.withWallet(createWallet())
				.__withAPI(mockedAPI)

			const userConfirmation = new ReplaySubject<ManualUserConfirmTX>()

			const transactionTracking = radix.transferTokens({
				...transferTokens(),
				userConfirmation,
			})

			let userHasBeenAskedToConfirmTXCounter = 0
			let calledConfirmationWhenItWasNotReady = false

			let confirmTx: () => void
			confirmTx = (): void => {
				calledConfirmationWhenItWasNotReady = true
			}

			let sub: Subscription

			sub = userConfirmation.subscribe((confirmation) => {
				userHasBeenAskedToConfirmTXCounter += 1
				if (userHasBeenAskedToConfirmTXCounter === 1) {
					confirmTx = confirmation.confirm
					radix.deriveNextAccount({ alsoSwitchTo: true })
				} else if (userHasBeenAskedToConfirmTXCounter > 4) {
					// break inf recursion.
					subs.remove(sub)
					sub.unsubscribe()
				}
			})

			subs.add(sub)

			subs.add(
				radix.activeAccount
					.pipe(
						skipWhile((i) => i.hdPath!.addressIndex.value() === 0),
					)
					.subscribe((i) => {
						expect(i.hdPath!.addressIndex.value()).toBe(1)
						confirmTx() // => will trigger tx to continue with signing.
					}),
			)

			subs.add(
				transactionTracking.completion.subscribe({
					next: (_txID) => {
						expect(calledConfirmationWhenItWasNotReady).toBe(false)
						expect(userHasBeenAskedToConfirmTXCounter).toBe(1)
						done()
					},
					error: (e) => {
						done(e)
					},
				}),
			)
		})

		it('should be able to call stake tokens', (done) => {
			const radix = Radix.create()
				.withWallet(createWallet())
				.__withAPI(mockedAPI)

			subs.add(
				radix
					.stakeTokens({
						stakeInput: {
							amount: 1,
							validator:
								'vb1qvx0emaq0tua6md7wu9c047mm5krrwnlfl8c7ws3jm2s9uf4vxcyvrwrazy',
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
					}),
			)
		})

		it('should be able to call unstake tokens', (done) => {
			const radix = Radix.create()
				.withWallet(createWallet())
				.__withAPI(mockedAPI)

			subs.add(
				radix
					.unstakeTokens({
						unstakeInput: {
							amount: 1,
							validator:
								'vb1qvx0emaq0tua6md7wu9c047mm5krrwnlfl8c7ws3jm2s9uf4vxcyvrwrazy',
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
					}),
			)
		})

		describe('transaction flow errors', () => {
			beforeAll(() => {
				jest.spyOn(console, 'error').mockImplementation(() => {})
			})

			afterAll(() => {
				jest.clearAllMocks()
			})

			const testFailure = (
				method: string,
				cause: ErrorCause,
				done: any,
			) => {
				const errorMsg = mockErrorMsg(`TXFlow`)

				const radix = Radix.create()
					.withWallet(createWallet())
					.__withAPI(
						of({
							...mockRadixCoreAPI(),
							[method]: (_intent: any) => {
								throw Error(errorMsg)
							},
						}),
					)
					.logLevel(LogLevel.SILENT)

				const transactionTracking = radix.transferTokens(
					transferTokens(),
				)

				subs.add(
					transactionTracking.completion.subscribe({
						complete: () => {
							done(
								new Error(
									'TX was successful, but we expected an error.',
								),
							)
						},
						error: (error: APIError) => {
							expect(error.errors.length).toBe(1)
							expect(error.errors[0].message).toBe(errorMsg)
							expect(error.category).toEqual(ErrorCategory.API)
							expect(error.cause).toEqual(cause)
							done()
						},
					}),
				)
			}

			it('buildTransaction', (done) => {
				testFailure(
					'buildTransaction',
					APIErrorCause.BUILD_TRANSACTION_FAILED,
					done,
				)
			})
			it('submitSignedTransaction', (done) => {
				testFailure(
					'submitSignedTransaction',
					APIErrorCause.SUBMIT_SIGNED_TX_FAILED,
					done,
				)
			})
			it('finalizeTransaction', (done) => {
				testFailure(
					'finalizeTransaction',
					APIErrorCause.FINALIZE_TX_FAILED,
					done,
				)
			})
		})
	})

	it('special signingKeychain with preallocated funds', (done) => {
		const subs = new Subscription()

		const walletWithFunds = makeWalletWithFunds()

		const radix = Radix.create()
			.__withAPI(
				of({
					...mockRadixCoreAPI(),
					networkId: (): Observable<NetworkT> => {
						return of(NetworkT.BETANET).pipe(shareReplay(1))
					},
				}),
			)
			.withWallet(walletWithFunds)

		const expectedAddresses: string[] = [
			'brx1qsp8n0nx0muaewav2ksx99wwsu9swq5mlndjmn3gm9vl9q2mzmup0xqmhf7fh',
			'brx1qspvvprlj3q76ltdxpz5qm54cp7dshrh3e9cemeu5746czdet3cfaegp6s708',
			'brx1qsp0jvy2qxf93scsfy6ylp0cn4fzndf3epzcxmuekzrqrugnhnsrd7gah8wq5',
			'brx1qspwfy7m78qsmq8ntq0yjpynpv2qfnrvzwgqacr4s360499tarzv6yctz3ahh',
			'brx1qspzlz77f5dqwgyn2k62wfg2t3gj36ytsj7accv6kl9634tfkfqwleqmpz874',
		]

		subs.add(
			radix.activeAddress
				.pipe(
					map((a: AccountAddressT) => a.toString()),
					take(expectedAddresses.length),
					toArray(),
				)
				.subscribe(
					(values) => {
						expect(values).toStrictEqual(expectedAddresses)
						done()
					},
					(error) => {
						done(error)
					},
				),
		)
	})

	describe('tx history returns type of tx', () => {
		const testTXType = (
			fromMe: boolean,
			toMe: boolean,
			expectedTxType: TransactionType,
			done: jest.DoneCallback,
		): void => {
			const subs = new Subscription()

			const xrdRRI = ResourceIdentifier.fromUnsafe(
				'xrd_rb1qya85pwq',
			)._unsafeUnwrap()

			const txID = TransactionIdentifier.create(
				'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
			)._unsafeUnwrap()

			const makeTransfer = (
				input: Readonly<{
					from: AccountAddressT
					to: AccountAddressT
					amount?: number
				}>,
			): ExecutedTransferTokensAction => {
				return {
					...input,
					type: ActionType.TOKEN_TRANSFER,
					rri: xrdRRI,
					amount: Amount.fromUnsafe(
						input.amount ?? 1337,
					)._unsafeUnwrap(),
				}
			}

			const wallet = makeWalletWithFunds()
			const network = NetworkT.BETANET
			const myAddress = AccountAddress.fromPublicKeyAndNetwork({
				publicKey: wallet.__unsafeGetAccount().publicKey,
				network,
			})

			const mockApi = (): RadixCoreAPI => {
				const makeTX = (): SimpleExecutedTransaction => {
					return {
						txID,
						sentAt: new Date(),
						fee: Amount.fromUnsafe(1)._unsafeUnwrap(),
						actions: <ExecutedAction[]>[
							makeTransfer({
								from: fromMe ? myAddress : bob,
								to: toMe ? myAddress : carol,
							}),
							{
								type: ActionType.OTHER,
							},
							{
								type: ActionType.STAKE_TOKENS,
								from: fromMe ? myAddress : bob,
								validator: ValidatorAddress.fromUnsafe(
									'vb1qgfqnj34dn7qp9wvf4l6rhw6hu3l82rcqh3rjtk080t75t888u98wkh3gjq',
								)._unsafeUnwrap(),
								amount: Amount.fromUnsafe(1)._unsafeUnwrap(),
							},
							{
								type: ActionType.UNSTAKE_TOKENS,
								from: fromMe ? myAddress : bob,
								validator: ValidatorAddress.fromUnsafe(
									'vb1qgfqnj34dn7qp9wvf4l6rhw6hu3l82rcqh3rjtk080t75t888u98wkh3gjq',
								)._unsafeUnwrap(),
								amount: Amount.fromUnsafe(1)._unsafeUnwrap(),
							},
						],
					}
				}

				return {
					...mockRadixCoreAPI(),
					lookupTransaction: (_) => {
						return of(makeTX())
					},
					transactionHistory: (_) => {
						return of({
							cursor: 'AN_EMPTY_CURSOR',
							transactions: <ExecutedTransaction[]>[makeTX()],
						}).pipe(shareReplay(1))
					},
				}
			}

			const radix = Radix.create({ network })
				.withWallet(wallet)
				.__withAPI(of(mockApi()))

			const assertTX = (tx: ExecutedTransaction): void => {
				expect(tx.transactionType).toBe(expectedTxType)
			}

			subs.add(
				radix.transactionHistory({ size: 1 }).subscribe(
					(hist) => {
						expect(hist.transactions.length).toBe(1)
						const txFromhistory = hist.transactions[0]

						assertTX(txFromhistory)
						subs.add(
							radix
								.lookupTransaction(<TransactionIdentifierT>{})
								.subscribe(
									(txFromLookup) => {
										assertTX(txFromLookup)
										done()
									},
									(error) => {
										new Error(
											`Expected tx history but got error: ${msgFromError(
												error,
											)}`,
										)
									},
								),
						)
					},
					(error) => {
						done(
							new Error(
								`Expected tx history but got error: ${msgFromError(
									error,
								)}`,
							),
						)
					},
				),
			)
		}

		it('outgoing', (done) => {
			testTXType(true, false, TransactionType.OUTGOING, done)
		})
		it('incoming', (done) => {
			testTXType(false, true, TransactionType.INCOMING, done)
		})
		it('from_me_to_me', (done) => {
			testTXType(true, true, TransactionType.FROM_ME_TO_ME, done)
		})
		it('unrelated', (done) => {
			testTXType(false, false, TransactionType.UNRELATED, done)
		})
	})
})
