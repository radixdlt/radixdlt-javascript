import { WalletT, AddressT } from '../src/_types'
import { Wallet } from '../src/wallet'
import { Mnemonic } from '../src/bip39/mnemonic'
import { HDMasterSeed } from '../src/bip39/hdMasterSeed'
import { HDMasterSeedT } from '../src/bip39/_types'
import { map, take, toArray } from 'rxjs/operators'
import { KeystoreT, PublicKey } from '@radixdlt/crypto'
import { combineLatest, of, Subject } from 'rxjs'
import { Magic, magicFromNumber } from '@radixdlt/primitives'

const createWallet = (): WalletT => {
	const mnemonic = Mnemonic.generateNew()
	const masterSeed: HDMasterSeedT = HDMasterSeed.fromMnemonic({ mnemonic })
	return Wallet.create({ masterSeed })
}

const createSpecificWallet = (): WalletT => {
	const masterSeed = HDMasterSeed.fromSeed(
		Buffer.from('deadbeef'.repeat(8), 'hex'),
	)
	return Wallet.create({ masterSeed })
}

const expectWalletsEqual = (
	wallets: { wallet1: WalletT; wallet2: WalletT },
	done: jest.DoneCallback,
): void => {
	const { wallet1, wallet2 } = wallets
	const wallet1Account1PublicKey$ = wallet1.deriveNext().derivePublicKey()
	const wallet2Account1PublicKey$ = wallet2.deriveNext().derivePublicKey()
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
	})
}

describe('HD Wallet', () => {
	it('can be created via keystore', async (done) => {
		const mnemonic = Mnemonic.generateNew()

		const password = 'super secret password'

		let load: () => Promise<KeystoreT>

		await Wallet.byEncryptingSeedOfMnemonicAndSavingKeystore({
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

	it('save errors are propagated', async (done) => {
		const mnemonic = Mnemonic.generateNew()
		const password = 'super secret password'

		const errMsg = 'ERROR_FROM_TEST'

		await Wallet.byEncryptingSeedOfMnemonicAndSavingKeystore({
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

		const errMsg = 'ERROR_FROM_TEST'

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
		const magicSubject = new Subject<Magic>()
		wallet.provideMagic(magicSubject.asObservable())

		wallet.provideMagic(of(magicFromNumber(123)))

		const magic = magicFromNumber(123)
		wallet.observeActiveAddress().subscribe((address) => {
			expect(address.magicByte).toBe(magic.byte)
			done()
		})
		magicSubject.next(magic)
	})

	it('can change magic', async (done) => {
		const wallet = createSpecificWallet()

		const m1 = magicFromNumber(1)
		const m2 = magicFromNumber(2)

		const expectedValues = [m1, m2].map((m) => m.byte)

		wallet.provideMagic(of(m1))
		wallet.provideMagic(of(m2))

		wallet
			.observeActiveAddress()
			.pipe(
				map((a: AddressT) => a.magicByte),
				take(2),
				toArray(),
			)
			.subscribe(
				(magic) => {
					expect(magic).toStrictEqual(expectedValues)
					done()
				},
				(error) => done(error),
			)
	})
})
