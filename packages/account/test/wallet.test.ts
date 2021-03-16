import { WalletT } from '../src/_types'
import { Wallet } from '../src/wallet'
import { Mnemonic } from '../src/bip39/mnemonic'
import { HDMasterSeed } from '../src/bip39/hdMasterSeed'
import { HDMasterSeedT } from '../src/bip39/_types'
import { unlinkSync } from 'fs'
import { take, toArray } from 'rxjs/operators'
import { Keystore, PublicKey } from '@radixdlt/crypto'

const createWallet = (): WalletT => {
	const mnemonic = Mnemonic.generateNew()
	const masterSeed: HDMasterSeedT = HDMasterSeed.fromMnemonic({ mnemonic })
	return Wallet.create({ masterSeed })
}
import { combineLatest, of, Subject } from 'rxjs'
import { Magic, magicFromNumber } from '@radixdlt/primitives'

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
		const keystorePath = './keystoreFromTest.json'

		Wallet.byEncryptingSeedOfMnemonic({
			mnemonic,
			password,
			saveKeystoreAtPath: keystorePath,
		})
			.andThen((wallet1) =>
				Keystore.fromFileAtPath(keystorePath)
					.andThen((keystore) =>
						Wallet.fromKeystore({ keystore, password }),
					)
					.map((wallet2) => ({ wallet1, wallet2 })),
			)
			.match(
				(wallets) => {
					expectWalletsEqual(wallets, done)
				},
				(e) => done(e),
			)
			.finally(() => unlinkSync(keystorePath))
	})

	it(`can create a wallet then load it from path later`, async (done) => {
		const mnemonic = Mnemonic.generateNew()

		const password = 'super secret password'
		const keystorePath = './keystoreFromTest.json'

		Wallet.byEncryptingSeedOfMnemonic({
			password,
			saveKeystoreAtPath: keystorePath,
			mnemonic,
		})
			.andThen((createdWallet) =>
				Wallet.fromKeystoreAtPath({ keystorePath, password }).map(
					(loadedWallet) => ({
						wallet1: createdWallet,
						wallet2: loadedWallet,
					}),
				),
			)
			.match(
				(wallets) => expectWalletsEqual(wallets, done),
				(e) => done(e),
			)
			.finally(() => unlinkSync(keystorePath))
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

		wallet.observeActiveAccount().subscribe({
			next: (active) => {
				expect(active.hdPath.addressIndex.value()).toBe(1)
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
		wallet.switchAccount({ to: 0 })
	})

	it('can derive address for accounts', async (done) => {
		const wallet = createWallet()
		const magicSubject = new Subject<Magic>()
		wallet.provideMagic(magicSubject.asObservable())
		const magic = magicFromNumber(123)
		wallet.observeActiveAddress().subscribe((address) => {
			expect(address.magicByte).toBe(magic.byte)
			done()
		})
		magicSubject.next(magic)
	})
})
