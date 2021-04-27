import { AccountAddressT, NetworkT, WalletT, Wallet, Mnemonic } from '../src'
import { map, take, toArray } from 'rxjs/operators'
import { KeystoreT, PublicKey } from '@radixdlt/crypto'
import { combineLatest, of, Subject, Subscription } from 'rxjs'
import { restoreDefaultLogLevel, setLogLevel } from '@radixdlt/util'
import { mockErrorMsg } from '../../util/test/util'

const createWallet = (network?: NetworkT): WalletT => {
	const mnemonic = Mnemonic.generateNew()

	const wallet = Wallet.create({ mnemonic })
	wallet.provideNetworkId(of(NetworkT.BETANET))
	return wallet
}

const createSpecificWallet = (network?: NetworkT): WalletT => {
	const mnemonic = Mnemonic.fromEnglishPhrase(
		'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
	)._unsafeUnwrap()
	const wallet =  Wallet.create({ mnemonic })
	wallet.provideNetworkId(of(network ?? NetworkT.BETANET))
	return wallet
}

const expectWalletsEqual = (
	wallets: { wallet1: WalletT; wallet2: WalletT },
	done: jest.DoneCallback,
): void => {
	const subs = new Subscription()
	const { wallet1, wallet2 } = wallets
	wallet1.provideNetworkId(of(NetworkT.BETANET))
	wallet2.provideNetworkId(of(NetworkT.BETANET))
	const wallet1Account1PublicKey$ = wallet1.deriveNext().pipe(map((a) => { console.log(`🔮 got account from wallet 1`);return a.publicKey })) //.derivePublicKey()
	const wallet2Account1PublicKey$ = wallet2.deriveNext().pipe(map((a) => { console.log(`🔮 got account from wallet 2`);return a.publicKey })) //.derivePublicKey()
	combineLatest(
		wallet1Account1PublicKey$,
		wallet2Account1PublicKey$,
	).subscribe({
		next: (keys: PublicKey[]) => {
			console.log(`👻 jippie! got accounts...`)
			expect(keys.length).toBe(2)
			const a = keys[0]
			const b = keys[1]
			expect(a.equals(b)).toBe(true)
			done()
		},
		error: (e) => done(e),
	}).add(subs)
}

describe('wallet_type', () => {
	it('can be created via keystore', async (done) => {

		const mnemonic = Mnemonic.generateNew()

		const password = 'super secret password'

		let load: () => Promise<KeystoreT>
		await Wallet.byEncryptingMnemonicAndSavingKeystore({
			mnemonic,
			password,
			save: (keystoreToSave: KeystoreT) => {
				load = () => Promise.resolve(keystoreToSave)
				return Promise.resolve(undefined)
			},
		})
			.andThen((wallet1) =>
				Wallet.byLoadingAndDecryptingKeystore({ password, load }).map(
					(wallet2) => ({
						wallet1,
						wallet2,
					}),
				),
			)
			.match(
				(wallets) => {
					console.log(`🔥 comparing wallets...`)
					expectWalletsEqual(wallets, done)
				},
				(e) => done(e),
			)
	})

	it('mnemonic can be retrieved with password', () => {
		const mnemonicPhrase =
			'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
		const mnemonic = Mnemonic.fromEnglishPhrase(
			mnemonicPhrase,
		)._unsafeUnwrap()
		const wallet = Wallet.create({ mnemonic })
		const mnemonicRevealed = wallet.revealMnemonic()
		expect(mnemonicRevealed.equals(mnemonic)).toBe(true)
		expect(mnemonicRevealed.phrase).toBe(mnemonicPhrase)
	})

	it('wallet can restoreAccountsUpToIndex', (done) => {
		const subs = new Subscription()
		const wallet = createWallet()

		const index = 3
		wallet
			.restoreAccountsUpToIndex(index)
			.subscribe(
				(accounts) => {
					expect(accounts.size).toBe(index)
					done()
				},
				(e) => {
					done(e)
				},
			)
			.add(subs)
	})
	/*
		describe('failing wallet scenarios', () => {
			beforeAll(() => {
				setLogLevel('silent')
			})

			afterAll(() => {
				restoreDefaultLogLevel()
			})

			it('save errors are propagated', async (done) => {
				const mnemonic = Mnemonic.generateNew()
				const password = 'super secret password'

				const errMsg = mockErrorMsg('SaveError')

				await Wallet.byEncryptingMnemonicAndSavingKeystore({
					mnemonic,
					password,
					save: (_) => Promise.reject(new Error(errMsg)),
				}).match(
					(_) => done(new Error('Expected error but got none')),
					(error) => {
						expect(error.message).toBe(
							`Failed to save keystore, underlying error: '${errMsg}'`,
						)
						done()
					},
				)
			})

			it('load errors are propagated', async (done) => {
				const password = 'super secret password'

				const errMsg = mockErrorMsg('LoadError')

				await Wallet.byLoadingAndDecryptingKeystore({
					password,
					load: () => Promise.reject(new Error(errMsg)),
				}).match(
					(_) => done(new Error('Expected error but got none')),
					(error) => {
						expect(error.message).toBe(
							`Failed to load keystore, underlying error: '${errMsg}'`,
						)
						done()
					},
				)
			})
		})

		it('can observe accounts', (done) => {
			const wallet = createWallet()
			wallet.observeAccounts().subscribe((result) => {
				expect(result.all.length).toBe(1)
				done()
			})
		})

		it('can observe active account', (done) => {
			const wallet = createWallet()

			wallet.observeActiveAccount().subscribe((active) => {
				expect(active.hdPath.addressIndex.value()).toBe(0)
				expect(active.hdPath.toString()).toBe(`m/44'/536'/0'/0/0'`)
				expect(
					wallet.__unsafeGetAccount().hdPath.equals(active.hdPath),
				).toBe(true)
				done()
			})
		})

		it('should derive next but not switch to it by default', (done) => {
			const wallet = createWallet()
			wallet.deriveNext()

			wallet.observeActiveAccount().subscribe((active) => {
				expect(active.hdPath.addressIndex.value()).toBe(0)
				done()
			})
		})

		it('should derive next and switch to it if specified', async (done) => {
			const wallet = createWallet()
			wallet.deriveNext({ alsoSwitchTo: true })

			const expectedValues = [0, 1] // we start at 0 by default, then switch to 1

			wallet
				.observeActiveAccount()
				.pipe(
					map((a) => a.hdPath.addressIndex.value()),
					take(2),
					toArray(),
				)
				.subscribe({
					next: (values) => {
						expect(values).toStrictEqual(expectedValues)
						done()
					},
					error: (e) => done(e),
				})
		})

		it('can list all accounts that has been added', (done) => {
			const wallet = createWallet()
			wallet.deriveNext()
			wallet.deriveNext()

			wallet.observeAccounts().subscribe((result) => {
				expect(result.all.length).toBe(3)
				done()
			})
		})

		it('can switch account by number', (done) => {
			const wallet = createWallet()

			const expectedAccountAddressIndices = [0, 1, 0]

			wallet
				.observeActiveAccount()
				.pipe(take(expectedAccountAddressIndices.length), toArray())
				.subscribe({
					next: (accountList) => {
						expect(
							accountList.map((a) => a.hdPath.addressIndex.value()),
						).toStrictEqual(expectedAccountAddressIndices)
						done()
					},
					error: (e) => done(e),
				})

			wallet.deriveNext({ alsoSwitchTo: true })
			wallet.switchAccount({ toIndex: 0 })
		})

		it('can derive address for accounts', async (done) => {
			const wallet = createWallet()
			const networkIdSubject = new Subject<NetworkT>()
			wallet.provideNetworkId(networkIdSubject.asObservable())

			wallet.observeActiveAddress().subscribe((address) => {
				expect(address.network).toBe(NetworkT.MAINNET)
				done()
			})
			networkIdSubject.next(NetworkT.MAINNET)
		})

		it('can change networkID', async (done) => {
			const wallet = createSpecificWallet()

			const n1 = NetworkT.MAINNET
			const n2 = NetworkT.BETANET

			const expectedValues = [n1, n2]

			wallet.provideNetworkId(of(n1))
			wallet.provideNetworkId(of(n2))

			wallet
				.observeActiveAddress()
				.pipe(
					map((a: AccountAddressT) => a.network),
					take(2),
					toArray(),
				)
				.subscribe(
					(networks: NetworkT[]) => {
						expect(networks).toStrictEqual(expectedValues)
						done()
					},
					(error) => done(error),
				)
		})

	 */
})
