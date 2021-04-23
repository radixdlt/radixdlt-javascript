import { Radix } from '../src/radix'
import {
	AccountT,
	Address,
	AddressT,
	HDMasterSeed,
	Mnemonic,
	NetworkT,
	ValidatorAddress,
	Wallet,
	WalletT,
} from '@radixdlt/account'
import {
	interval,
	Observable,
	of,
	ReplaySubject,
	Subscription,
	throwError,
} from 'rxjs'
import { map, mergeMap, shareReplay, take, tap, toArray } from 'rxjs/operators'
import { KeystoreT, PublicKey, publicKeyFromBytes } from '@radixdlt/crypto'
import {
	ManualUserConfirmTX,
	RadixT,
	TransferTokensOptions,
} from '../src/_types'
import {
	APIError,
	APIErrorCause,
	ErrorCategory,
	ErrorCause,
} from '../src/errors'
import {
	alice,
	balancesFor,
	bob,
	mockedAPI,
	mockRadixCoreAPI,
} from '../src/mockRadix'
import { NodeT, RadixCoreAPI } from '../src/api/_types'
import {
	SimpleTokenBalances,
	TokenBalances,
	TransactionIdentifierT,
	TransactionStatus,
	TransactionTrackingEventType,
} from '../src/dto/_types'
import { TransactionIdentifier } from '../src/dto/transactionIdentifier'
import { AmountT, one } from '@radixdlt/primitives'
import {
	isIntendedStakeTokensAction,
	isIntendedTransferTokensAction,
	isIntendedUnstakeTokensAction,
	TransactionIntentBuilder,
} from '../src/dto/transactionIntentBuilder'
import { TransferTokensInput } from '../src/actions/_types'
import {
	log,
	msgFromError,
	restoreDefaultLogLevel,
	setLogLevel,
} from '@radixdlt/util'
import { mockErrorMsg } from '../../util/test/util'
import {
	ExecutedAction,
	ExecutedStakeTokensAction,
	ExecutedTransaction,
	ExecutedTransferTokensAction,
	ExecutedUnstakeTokensAction,
	IntendedAction,
	TransactionIntent,
} from '..'
import { signatureFromHexStrings } from '@radixdlt/crypto/test/utils'
import { makeWalletWithFunds } from '@radixdlt/account/test/utils'

const mockTransformIntentToExecutedTX = (
	txIntent: TransactionIntent,
): ExecutedTransaction => {
	const mockTransformIntendedActionToExecutedAction = (
		intendedAction: IntendedAction,
	): ExecutedAction => {
		if (isIntendedTransferTokensAction(intendedAction)) {
			const tokenTransfer: ExecutedTransferTokensAction = {
				...intendedAction,
				rri: intendedAction.tokenIdentifier,
			}
			return tokenTransfer
		} else if (isIntendedStakeTokensAction(intendedAction)) {
			const stake: ExecutedStakeTokensAction = {
				...intendedAction,
			}
			return stake
		} else if (isIntendedUnstakeTokensAction(intendedAction)) {
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

	const executedTx: ExecutedTransaction = {
		txID: TransactionIdentifier.create(
			'deadbeef'.repeat(8),
		)._unsafeUnwrap(),
		sentAt: new Date(Date.now()),
		fee: one,
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

const createWallet = (): WalletT => {
	const mnemonic = Mnemonic.fromEnglishPhrase(
		'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
	)._unsafeUnwrap()
	return Wallet.create({ mnemonic })
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

describe('Radix API', () => {
	it('can load test keystore', async (done) => {
		// keystoreForTest
		await Wallet.byLoadingAndDecryptingKeystore({
			password: keystoreForTest.password,
			load: () => Promise.resolve(keystoreForTest.keystore),
		}).match(
			(wallet) => {
				const revealedMnemonic = wallet.revealMnemonic()
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

	it('can connect and is chainable', () => {
		const radix = Radix.create().connect('https://www.my.node.com')
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
		const n1 = 'https://www.node1.com/'
		const n2 = 'https://www.node2.com/'

		await testChangeNode([n1, n2], done, (radix: RadixT) => {
			radix.withNodeConnection(dummyNode(n1))
			radix.withNodeConnection(dummyNode(n2))
		})
	})

	it('can change node with url', async (done) => {
		const n1 = 'https://www.node1.com/'
		const n2 = 'https://www.node2.com/'

		await testChangeNode([n1, n2], done, (radix: RadixT) => {
			radix.connect(n1)
			radix.connect(n2)
		})
	})

	it('can change api', async (done) => {
		const n1 = 'https://www.node1.com/'
		const n2 = 'https://www.node2.com/'

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

	it('radix can reveal mnemonic', (done) => {
		const subs = new Subscription()

		const radix = Radix.create()

		radix
			.revealMnemonic()
			.subscribe(
				(m) => {
					expect(m.phrase).toBe(
						keystoreForTest.expectedMnemonicPhrase,
					)
					done()
				},
				(e) => {
					done(e)
				},
			)
			.add(subs)

		radix.login(keystoreForTest.password, () =>
			Promise.resolve(keystoreForTest.keystore),
		)
	})

	describe('failing scenarios', () => {
		beforeAll(() => {
			setLogLevel('silent')
		})

		afterAll(() => {
			restoreDefaultLogLevel()
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

			const errMsg = mockErrorMsg('LoadError')

			const loadKeystoreError = (): Promise<KeystoreT> =>
				Promise.reject(new Error(errMsg))

			const loadKeystoreSuccess = (): Promise<KeystoreT> =>
				Promise.resolve(keystoreForTest.keystore)

			radix.login(keystoreForTest.password, loadKeystoreError)
			radix.login(keystoreForTest.password, loadKeystoreSuccess)
		})
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

	describe('radix unhappy paths', () => {
		beforeAll(() => {
			jest.spyOn(console, 'error').mockImplementation(() => {})
		})

		afterAll(() => {
			jest.clearAllMocks()
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
					expect(error.cause).toEqual(
						APIErrorCause.TOKEN_BALANCES_FAILED,
					)
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
					{ pkIndex: 0, tokenBalancesCount: 3 },
					{ pkIndex: 1, tokenBalancesCount: 5 },
					{ pkIndex: 2, tokenBalancesCount: 1 },
					{ pkIndex: 3, tokenBalancesCount: 1 },
					{ pkIndex: 4, tokenBalancesCount: 4 },
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

	it('tokenBalances with tokeninfo', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

		const loadKeystore = (): Promise<KeystoreT> =>
			Promise.resolve(keystoreForTest.keystore)

		radix.login(keystoreForTest.password, loadKeystore)

		radix.__wallet
			.subscribe((_w) => {
				type ExpectedValue = { name: string; amount: string }
				const expectedValues: ExpectedValue[] = [
					{ name: 'Gold token', amount: '1533' },
					{ name: 'Bar token', amount: '9066' },
					{ name: 'Rad', amount: '5060' },
				]

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
					})
					.add(subs)
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
					{ pkIndex: 0, actionsCountForEachTx: [3, 1, 2] },
					{ pkIndex: 1, actionsCountForEachTx: [2, 2, 1] },
					{ pkIndex: 2, actionsCountForEachTx: [1, 1, 2] },
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

	it('can lookup validator', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

		const loadKeystore = (): Promise<KeystoreT> =>
			Promise.resolve(keystoreForTest.keystore)

		radix.login(keystoreForTest.password, loadKeystore)

		const mockedValidatorAddr = ValidatorAddress.fromUnsafe(
			'vb1qvx0emaq0tua6md7wu9c047mm5krrwnlfl8c7ws3jm2s9uf4vxcyvrwrazy',
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
						).toBe('CXpz')
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
				expect(validators.validators.length).toEqual(10)
				done()
			})
			.add(subs)
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

		radix.ledger
			.buildTransaction(transactionIntent)
			.subscribe((unsignedTx) => {
				expect((unsignedTx as { fee: AmountT }).fee.toString()).toEqual(
					'63140',
				)
				done()
			})
			.add(subs)
	})

	it('should get finalizeTransaction response', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

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

	it('should get network transaction demand response', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

		radix.ledger
			.networkTransactionDemand()
			.subscribe((result) => {
				expect(result.tps).toEqual(109)
				done()
			})
			.add(subs)
	})

	it('should get network transaction throughput response', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

		radix.ledger
			.networkTransactionThroughput()
			.subscribe((result) => {
				expect(result.tps).toEqual(10)
				done()
			})
			.add(subs)
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
			{ amount: 396, validator: 'ld', epochsUntil: 60 },
			{ amount: 878, validator: 'jq', epochsUntil: 46 },
			{ amount: 649, validator: '6t', epochsUntil: 59 },
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

	it('can decrypt encrypted message in transaction', (done) => {
		const subs = new Subscription()

		const radix = Radix.create().__withAPI(mockedAPI)

		const loadKeystore = (): Promise<KeystoreT> =>
			Promise.resolve(keystoreForTest.keystore)

		type SystemUnderTest = {
			plaintext: string
			pkOfActiveAccount0: PublicKey
			pkOfActiveAccount1: PublicKey
			recipient: PublicKey
			tx: ExecutedTransaction
			decrypted0: string
			decrypted1: string
		}

		const recipientPK = publicKeyFromBytes(
			Buffer.from(keystoreForTest.publicKeysCompressed[1], 'hex'),
		)._unsafeUnwrap()
		const recipientAddress = Address.fromPublicKeyAndNetwork({
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
		radix.__wallet
			.pipe(
				map(
					(w: WalletT): AccountT => {
						const account = w.__unsafeGetAccount()
						sut.pkOfActiveAccount0 = account.__unsafeGetPublicKey()
						return account
					},
				),
				mergeMap(
					(account: AccountT): Observable<TransactionIntent> => {
						return txIntentBuilder
							.transferTokens(tokenTransferInput)
							.message(plaintext)
							.build({
								encryptMessageIfAnyWithAccount: of(account),
							})
					},
				),
				map(
					(intent: TransactionIntent): ExecutedTransaction =>
						mockTransformIntentToExecutedTX(intent),
				),
				tap(
					(tx: ExecutedTransaction): ExecutedTransaction => {
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
				tap((a) => (sut.pkOfActiveAccount1 = a.__unsafeGetPublicKey())),
				mergeMap((_) => radix.decryptTransaction(sut.tx)),
				tap((decrypted) => (sut.decrypted1 = decrypted)),
			)
			.subscribe({
				next: (_) => {
					expect(sut).toBeDefined()
					expect(sut.plaintext).toBeDefined()
					expect(sut.decrypted0).toBeDefined()
					expect(sut.decrypted1).toBeDefined()
					expect(sut.pkOfActiveAccount0).toBeDefined()
					expect(sut.pkOfActiveAccount1).toBeDefined()
					expect(sut.recipient).toBeDefined()
					expect(sut.tx).toBeDefined()
					expect(sut.tx.message).toBeDefined()

					expect(sut.tx.actions.length).toBe(1)
					const transferTokensAction = sut.tx
						.actions[0] as ExecutedTransferTokensAction
					expect(
						transferTokensAction.to.publicKey.equals(sut.recipient),
					).toBe(true)

					expect(
						sut.pkOfActiveAccount0.equals(sut.pkOfActiveAccount1),
					).toBe(false)
					expect(sut.pkOfActiveAccount1.equals(sut.recipient)).toBe(
						true,
					)

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
			})
			.add(subs)

		radix.login(keystoreForTest.password, loadKeystore)
	})

	it('should be able to handle error on API call', (done) => {
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

		radix.ledger.nativeToken().subscribe({
			next: (token) => {
				done(Error('Should throw'))
			},
			error: (e: APIError) => {
				expect(e.errors.length).toEqual(1)
				expect(e.errors[0].message).toEqual(errorMsg)
				done()
			},
		})
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
				.withWallet(createWallet())
				.__withAPI(mockedAPI)

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
				.withWallet(createWallet())
				.__withAPI(mockedAPI)

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
				.withWallet(createWallet())
				.__withAPI(mockedAPI)

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
				})
				.add(subs)
		})

		it('should be able to call unstake tokens', (done) => {
			const radix = Radix.create()
				.withWallet(createWallet())
				.__withAPI(mockedAPI)

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
				})
				.add(subs)
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
					.logLevel('silent')

				const transactionTracking = radix.transferTokens(
					transferTokens(),
				)

				transactionTracking.completion
					.subscribe({
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
					})
					.add(subs)
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

	describe('special wallet with preallocated funds', () => {
		it('hardcoded funds', (done) => {
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
				'apa1',
				'apa2',
				'apa3',
				'apa4',
				'apa5',
			]

			radix.activeAddress
				.pipe(
					map((a: AddressT) => a.toString()),
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
				)
				.add(subs)

			radix.deriveNextAccount({ alsoSwitchTo: true })
			radix.deriveNextAccount({ alsoSwitchTo: true })
			radix.deriveNextAccount({ alsoSwitchTo: true })
			radix.deriveNextAccount({ alsoSwitchTo: true })
		})
	})
})
