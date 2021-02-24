import { generatePrivateKey, PrivateKey } from '@radixdlt/crypto'
import { EMPTY } from 'rxjs'
import { WalletT } from '../src/_types'
import { Wallet } from '../src/wallet'
import { Account } from '../src/account'
import { BIP44 } from '../src/bip32/bip44/bip44'

const walletByAddingAccountFromPrivateKey = (privateKey: PrivateKey): WalletT =>
	Wallet.create({
		accounts: new Set([Account.fromPrivateKey(privateKey)]),
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
		const wallet = Wallet.create({ accounts: new Set() })
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

		const wallet = Wallet.create({
			accounts: new Set([
				Account.fromPrivateKey(pk1),
				Account.fromPrivateKey(pk2),
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
		const wallet = Wallet.create({ accounts: new Set() })

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
		const wallet = Wallet.create({ accounts: new Set() })

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
		const wallet = Wallet.create({ accounts: new Set() })
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
		const wallet = Wallet.create({ accounts: new Set() })
		const hdPath = BIP44.create({ address: { index: 237 } })

		const hdAccount = Account.fromHDPathWithHardwareWallet({
			hdPath,
			onHardwareWalletConnect: EMPTY,
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
