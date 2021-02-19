import { generatePrivateKey, PrivateKey } from '@radixdlt/crypto'
import { accountFromPrivateKey } from '../src/account'
import { makeWallet } from '../src/wallet'
import { WalletT } from '../src/_types'

const walletByAddingAccountFromPrivateKey = (privateKey: PrivateKey): WalletT =>
	makeWallet({
		accounts: new Set([accountFromPrivateKey(privateKey)]),
	})

describe('wallet', () => {
	it('can observe accounts', async (done) => {
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

	it('can be created empty', async (done) => {
		const wallet = makeWallet({ accounts: new Set() })
		wallet.observeAccounts().subscribe((result) => {
			expect(result.all.length).toBe(0)
			done()
		})
	})
	it('can observe active account', async (done) => {
		const pk1 = generatePrivateKey()
		const publicKey = pk1.publicKey()
		const wallet = walletByAddingAccountFromPrivateKey(pk1)

		wallet.observeActiveAccount().subscribe((active) => {
			expect(active.accountId.accountIdString).toBe(publicKey.toString())
			done()
		})
	})

	it('when created with multiple accounts, the first one gets selected', async (done) => {
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

	it('for empty wallets when adding an account the wallet automatically sets it as the active account after subscription', async (done) => {
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

	it('for empty wallets when adding an account the wallet automatically sets it as the active account even before subscription', async (done) => {
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

	it('can list all accounts that has been added', async (done) => {
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
	it('prevents adding of same account twice', async (done) => {
		const pk1 = generatePrivateKey()
		const wallet = walletByAddingAccountFromPrivateKey(pk1)
		wallet.addAccountByPrivateKey(pk1)
		wallet.observeAccounts().subscribe((result) => {
			expect(result.all.length).toBe(1)
			done()
		})
	})
})
