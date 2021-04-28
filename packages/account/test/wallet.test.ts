import {
	AccountsT,
	AccountT,
	Mnemonic,
	NetworkT,
	Wallet,
	WalletT,
} from '../src'
import { map, mergeMap, take, toArray } from 'rxjs/operators'
import { KeystoreT, PublicKey } from '@radixdlt/crypto'
import { combineLatest, Observable, of, Subject, Subscription } from 'rxjs'
import { LogLevel, msgFromError, restoreDefaultLogLevel } from '@radixdlt/util'
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
		.deriveNext()
		.pipe(map((a) => a.publicKey))
	const wallet2Account1PublicKey$ = wallet2
		.deriveNext()
		.pipe(map((a) => a.publicKey))
	combineLatest(wallet1Account1PublicKey$, wallet2Account1PublicKey$)
		.subscribe({
			next: (keys: PublicKey[]) => {
				expect(keys.length).toBe(2)
				const a = keys[0]
				const b = keys[1]
				expect(a.equals(b)).toBe(true)
				done()
			},
			error: (e) => done(e),
		})
		.add(subs)
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
			expect(account.hdPath.addressIndex.value()).toBe(index)
		}

		wallet
			.restoreAccountsUpToIndex(indexToRestoreTo)
			.subscribe(
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

					wallet.deriveNext().subscribe(
						(another0) => {
							assertAccountHasCorrectIndex(another0)

							wallet.deriveNext().subscribe(
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
			)
			.add(subs)
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
})
