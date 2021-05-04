import { AccountsT, AccountT, Mnemonic, Wallet, WalletT } from '../src'
import { map, mergeMap, skipWhile, take, toArray } from 'rxjs/operators'
import { KeystoreT, PublicKey } from '@radixdlt/crypto'
import { combineLatest, Subscription } from 'rxjs'
import { LogLevel, restoreDefaultLogLevel } from '@radixdlt/util'
import { mockErrorMsg } from '../../util/test/util'
import { log } from '@radixdlt/util/dist/logging'

const createWallet = (
	input?: Readonly<{ startWithAnAccount?: boolean }>,
): WalletT => {
	const mnemonic = Mnemonic.generateNew()
	const startWithAnAccount = input?.startWithAnAccount ?? true
	return Wallet.create({ startWithAnAccount, mnemonic })
}

const createSpecificWallet = (
	input?: Readonly<{ startWithAnAccount?: boolean }>,
): WalletT => {
	const mnemonic = Mnemonic.fromEnglishPhrase(
		'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
	)._unsafeUnwrap()
	const startWithAnAccount = input?.startWithAnAccount ?? true
	return Wallet.create({ mnemonic, startWithAnAccount })
}

const expectWalletsEqual = (
	wallets: { wallet1: WalletT; wallet2: WalletT },
	done: jest.DoneCallback,
): void => {
	const subs = new Subscription()
	const { wallet1, wallet2 } = wallets
	const wallet1Account1PublicKey$ = wallet1
		.deriveNextLocalHDAccount()
		.pipe(map((a) => a.publicKey))
	const wallet2Account1PublicKey$ = wallet2
		.deriveNextLocalHDAccount()
		.pipe(map((a) => a.publicKey))

	subs.add(
		combineLatest(
			wallet1Account1PublicKey$,
			wallet2Account1PublicKey$,
		).subscribe({
			next: (keys: PublicKey[]) => {
				expect(keys.length).toBe(2)
				const a = keys[0]
				const b = keys[1]
				expect(a.equals(b)).toBe(true)
				done()
			},
			error: (e) => done(e),
		}),
	)
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

	it('the accounts derived after restoreAccountsUpToIndex has correct index', (done) => {
		const subs = new Subscription()
		const wallet = createWallet({ startWithAnAccount: false })

		const indexToRestoreTo = 3

		const assertAccountHasIndex = (
			account: AccountT,
			index: number,
		): void => {
			expect(account.hdPath!.addressIndex.value()).toBe(index)
		}

		subs.add(
			wallet.restoreLocalHDAccountsUpToIndex(indexToRestoreTo).subscribe(
				(accounts) => {
					expect(accounts.size).toBe(indexToRestoreTo)

					let next = 0
					const assertAccountHasCorrectIndex = (
						account: AccountT,
					): void => {
						assertAccountHasIndex(account, next)
						next += 1
					}

					for (const account of accounts.all) {
						assertAccountHasCorrectIndex(account)
					}

					wallet.deriveNextLocalHDAccount().subscribe(
						(another0) => {
							assertAccountHasCorrectIndex(another0)

							wallet.deriveNextLocalHDAccount().subscribe(
								(another1) => {
									assertAccountHasCorrectIndex(another1)
									done()
								},
								(e) => done(e),
							)
						},
						(e) => done(e),
					)
				},
				(e) => {
					done(e)
				},
			),
		)
	})

	describe('failing wallet scenarios', () => {
		beforeAll(() => {
			log.setLevel(LogLevel.SILENT)
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

	it('wallet can observe accounts', (done) => {
		const subs = new Subscription()
		const wallet = createWallet({ startWithAnAccount: true })
		const expected = [0, 1] // we start with 0 accounts but "immediately" derive a first one, before 0 can be emitted

		subs.add(
			wallet
				.observeAccounts()
				.pipe(
					map((a) => a.all.length),
					take(expected.length),
					toArray(),
				)
				.subscribe((values) => {
					expect(values).toStrictEqual(expected)
					done()
				}),
		)

		subs.add(wallet.deriveNextLocalHDAccount().subscribe())
	})

	it('can observe active account', (done) => {
		const subs = new Subscription()
		const wallet = createWallet()

		subs.add(
			wallet.observeActiveAccount().subscribe((active) => {
				expect(active.hdPath!.addressIndex.value()).toBe(0)
				expect(active.hdPath!.toString()).toBe(`m/44'/536'/0'/0/0'`)
				expect(
					wallet.__unsafeGetAccount().hdPath!.equals(active.hdPath),
				).toBe(true)
				done()
			}),
		)
	})

	it('should derive next but not switch to it by default', (done) => {
		const wallet = createWallet()
		const subs = new Subscription()

		subs.add(wallet.deriveNextLocalHDAccount().subscribe())

		subs.add(
			wallet.observeActiveAccount().subscribe((active) => {
				expect(active.hdPath!.addressIndex.value()).toBe(0)
				done()
			}),
		)
	})

	it('should derive next and switch to it if specified', async (done) => {
		const subs = new Subscription()
		const wallet = createWallet()

		subs.add(
			wallet.deriveNextLocalHDAccount({ alsoSwitchTo: true }).subscribe(),
		)

		const expectedValues = [0, 1] // we start at 0 by default, then switch to 1

		subs.add(
			wallet
				.observeActiveAccount()
				.pipe(
					map((a) => a.hdPath!.addressIndex.value()),
					take(2),
					toArray(),
				)
				.subscribe({
					next: (values) => {
						expect(values).toStrictEqual(expectedValues)
						done()
					},
					error: (e) => done(e),
				}),
		)
	})

	it('can list all accounts that has been added', (done) => {
		const testAccountsList = (
			mapAccountsToNum: (accounts: AccountsT) => number,
		): void => {
			const subs = new Subscription()
			const wallet = createWallet()
			const expectedValues = [1]//, 2, 3]


			subs.add(
				wallet
					.observeAccounts()
					.pipe(
						map((acs) => mapAccountsToNum(acs)),
						take(expectedValues.length),
						toArray(),
					)
					.subscribe((values) => {
						console.log(`💟 3️⃣  NEXT`)
						expect(values).toStrictEqual(expectedValues)
						done()
					}),
			)

			subs.add(
				wallet.deriveNextLocalHDAccount().subscribe({
					next: (_) => {
						console.log(`💟  1️⃣ NEXT!!`)
					},
					complete: () => {
						console.log(`💟  1️⃣ COMPLETE`)
						subs.add(
							wallet.deriveNextLocalHDAccount().subscribe({
								complete: () => {
									console.log(`💟  2️⃣  COMPLETE`)
								},
							}),
						)
					},
				}),
			)
		}

		testAccountsList(acs => acs.localHDAccounts().length)
		// testAccountsList(acs => acs.all.length)
		// testAccountsList((acs) => acs.size)
	})

	it('can switch account by number', (done) => {
		const subs = new Subscription()
		const wallet = createWallet()

		const expectedAccountAddressIndices = [0, 1, 0]

		subs.add(
			wallet
				.observeActiveAccount()
				.pipe(take(expectedAccountAddressIndices.length), toArray())
				.subscribe({
					next: (accountList) => {
						expect(
							accountList.map((a) =>
								a.hdPath!.addressIndex.value(),
							),
						).toStrictEqual(expectedAccountAddressIndices)
						done()
					},
					error: (e) => done(e),
				}),
		)

		subs.add(
			wallet.deriveNextLocalHDAccount({ alsoSwitchTo: true }).subscribe(),
		)

		// subs.add(
		wallet.switchAccount({ toIndex: 0 })
		// .subscribe())
	})
})
