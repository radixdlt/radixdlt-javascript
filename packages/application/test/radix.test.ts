import { Radix } from '../src/radix'
import {
	Address,
	AddressT,
	HDMasterSeed,
	Wallet,
	WalletT,
} from '@radixdlt/account'
import { interval, Observable, of, Subscription, throwError, timer } from 'rxjs'
import {
	DenominationOutputFormat,
	Magic,
	magicFromNumber,
} from '@radixdlt/primitives'
import { map, take, toArray } from 'rxjs/operators'

import { KeystoreT } from '@radixdlt/crypto'
import { RadixT } from '../src/_types'
import { APIErrorCause, ErrorCategory } from '../src/errors'

import {
	balancesFor,
	barToken,
	crashingAPI,
	fooToken,
	mockedAPI,
	tokenByRRIMap,
	xrd,
} from './mockRadix'
import { NodeT, RadixCoreAPI } from '../src/api/_types'
import { Token, TokenBalances } from '../src/dto/_types'

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

const mockAPI = (urlString?: string): Observable<RadixCoreAPI> => {
	const mockedPartialAPI = {
		...crashingAPI,
		node: { url: new URL(urlString ?? 'http://www.example.com') },
		networkId: (): Observable<Magic> => of(magicFromNumber(123)),
		nativeToken: (): Observable<Token> => of(xrd),
	}
	return of(mockedPartialAPI)
}

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
		radix.__withAPI(mockAPI())

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
			radix.__withAPI(mockAPI(n1))
			radix.__withAPI(mockAPI(n2))
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
		radix.__withAPI(mockAPI())

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
		radix.__withAPI(mockAPI())

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

		const api = mockAPI()

		const radix = Radix.create()
			.__withAPI(api)
			.withTokenBalanceFetchTrigger(interval(1000))

		radix.tokenBalances
			.subscribe((n) => {
				done(Error('nope'))
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

		radix.ledger.tokenBalancesForAddress(
			Address.fromBase58String(
				'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
			)._unsafeUnwrap(),
		)
	})

	it('does not kill property observables when rpc requests fail', async (done) => {
		const subs = new Subscription()
		let amountVal = 100
		let counter = 0

		const api = of(<RadixCoreAPI>{
			...crashingAPI,
			networkId: (): Observable<Magic> => of(magicFromNumber(123)),
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

	it(`mocked API returns differnt but deterministic tokenBalances per account`, (done) => {
		const subs = new Subscription()

		const radix = Radix.create()

		const loadKeystore = (): Promise<KeystoreT> =>
			Promise.resolve(keystoreForTest.keystore)

		radix.login(keystoreForTest.password, loadKeystore)

		radix.__withAPI(mockedAPI)

		radix.tokenBalances
			.subscribe((tb) => {
				expect(tb.owner.publicKey.toString(true)).toBe(
					keystoreForTest.publicKeysCompressed[0],
				)

				expect(tb.tokenBalances.length).toBe(3)

				const tbList = tb.tokenBalances

				const tb0 = tbList[0]
				expect(tb0.token.equals(fooToken.rri)).toBe(true)
				expect(
					tb0.amount.toString({
						denominationOutputFormat:
							DenominationOutputFormat.SHOW_SYMBOL,
					}),
				).toBe('7556')

				const tb1 = tbList[1]
				expect(tb1.token.equals(barToken.rri)).toBe(true)
				expect(tb1.amount.toString()).toBe('7642 E-3')

				const tb2 = tbList[2]
				expect(tb2.token.equals(xrd.rri)).toBe(true)
				expect(tb2.amount.toString()).toBe('4489')

				done()
			})
			.add(subs)
	})

	it('map of tokens rri', () => {
		expect(tokenByRRIMap.get(xrd.rri)!.description).toBe(xrd.description)
		expect(tokenByRRIMap.get(fooToken.rri)!.description).toBe(
			fooToken.description,
		)
		expect(tokenByRRIMap.get(barToken.rri)!.description).toBe(
			barToken.description,
		)
	})
})
