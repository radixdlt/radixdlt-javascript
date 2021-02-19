import { generatePrivateKey, PrivateKey } from '@radixdlt/crypto'
import { EMPTY } from 'rxjs'
import { accountFromPrivateKey, childAccountFromHDPathAndNode } from '../src/account'
import { makeWallet } from '../src/wallet'
import { bip44 } from '../src/_index'
import { WalletT } from '../src/_types'

const walletByAddingAccountFromPrivateKey = (privateKey: PrivateKey): WalletT =>
	makeWallet({
		accounts: new Set([accountFromPrivateKey(privateKey)]),
	})

describe('wallet', () => {
	it('can observe accounts', (done) => {
		const pk1 = generatePrivateKey()
		const publicKey = pk1.publicKey()
		const wallet = walletByAddingAccountFromPrivateKey(pk1)
		wallet.observeAccounts().subscribe((result) => {
			expect(result.all.length).toBe(1)
			const a0 = result.get(pk1.publicKey())!
			expect(a0!.accountId.accountIdString).toBe(publicKey.toString())
			done()
		})
	})

	it('can be created empty', (done) => {
		const wallet = makeWallet({ accounts: new Set() })
		wallet.observeAccounts().subscribe((result) => {
			expect(result.all.length).toBe(0)
			done()
		})
	})

	it('can observe active account', (done) => {
		const pk1 = generatePrivateKey()
		const publicKey = pk1.publicKey()
		const wallet = walletByAddingAccountFromPrivateKey(pk1)

		wallet.observeActiveAccount().subscribe((active) => {
			expect(active.accountId.accountIdString).toBe(publicKey.toString())
			done()
		})
	})

	it('when created with multiple accounts, the first one gets selected', (done) => {
		const pk1 = generatePrivateKey()
		const pk2 = generatePrivateKey()

		const wallet = makeWallet({
			accounts: new Set([
				accountFromPrivateKey(pk1),
				accountFromPrivateKey(pk2),
			]),
		})

		wallet.observeActiveAccount().subscribe((active) => {
			expect(active.accountId.accountIdString).toBe(
				pk1.publicKey().toString(),
			)
			done()
		})
	})

	it('for empty wallets when adding an account the wallet automatically sets it as the active account after subscription', (done) => {
		const wallet = makeWallet({ accounts: new Set() })

		wallet.observeActiveAccount().subscribe((active) => {
			expect(active.accountId.accountIdString).toBe(
				pk1.publicKey().toString(),
			)
			done()
		})

		const pk1 = generatePrivateKey()
		wallet.addAccountByPrivateKey(pk1)
	})

	it('for empty wallets when adding an account the wallet automatically sets it as the active account even before subscription', (done) => {
		const wallet = makeWallet({ accounts: new Set() })

		const pk1 = generatePrivateKey()
		wallet.addAccountByPrivateKey(pk1)

		wallet.observeActiveAccount().subscribe((active) => {
			expect(active.accountId.accountIdString).toBe(
				pk1.publicKey().toString(),
			)
			done()
		})
	})

	it('can list all accounts that has been added', (done) => {
		const wallet = makeWallet({ accounts: new Set() })
		const size = 3
		Array.from({ length: size })
			.map((_) => generatePrivateKey())
			.forEach(wallet.addAccountByPrivateKey)

		wallet.observeAccounts().subscribe((result) => {
			expect(result.all.length).toBe(size)
			done()
		})
	})

	it('prevents adding of same account twice', (done) => {
		const pk1 = generatePrivateKey()
		const wallet = walletByAddingAccountFromPrivateKey(pk1)
		wallet.addAccountByPrivateKey(pk1)
		wallet.observeAccounts().subscribe((result) => {
			expect(result.all.length).toBe(1)
			done()
		})
	})

	it('can add hd accounts', (done) => {
		const wallet = makeWallet({ accounts: new Set() })
		const hdPath = bip44({ address: { index: 237 } })

		const hdAccount = childAccountFromHDPathAndNode({
			hdPath,
			hdNode: EMPTY,
		})

		wallet.addAccount(hdAccount)

		wallet.observeActiveAccount().subscribe((active) => {
			expect(active.accountId.accountIdString).toBe(
				`m/44'/536'/0'/0/237'`,
			)
			done()
		})
	})
})
