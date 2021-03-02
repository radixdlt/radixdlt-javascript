import { generatePrivateKey, PrivateKey } from '@radixdlt/crypto'
import { EMPTY } from 'rxjs'
import { WalletT } from '../src/_types'
import { Wallet } from '../src/wallet'
import { Account } from '../src/account'
import { BIP44 } from '../src/bip32/bip44/bip44'

const walletByAddingAccountFromPrivateKey = (privateKey: PrivateKey): WalletT =>
	Wallet.create({
		accounts: [Account.fromPrivateKey(privateKey)],
	})

describe('wallet', () => {
	it('can observe accounts', (done) => {
		const pk1 = generatePrivateKey()
		const publicKey = pk1.publicKey()
		const wallet = walletByAddingAccountFromPrivateKey(pk1)
		wallet.observeAccounts().subscribe((result) => {
			expect(result.all.length).toBe(1)
			const a0 = result.get(pk1.publicKey()).getOrThrow()
			expect(a0!.accountId.accountIdString).toBe(publicKey.toString())
			done()
		})
	})

	it('can be created empty', (done) => {
		const wallet = Wallet.create({ accounts: [] })
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
			accounts: [
				Account.fromPrivateKey(pk1),
				Account.fromPrivateKey(pk2),
			],
		})

		wallet.observeActiveAccount().subscribe((active) => {
			expect(active.accountId.accountIdString).toBe(
				pk1.publicKey().toString(),
			)
			done()
		})
	})

	it('for empty wallets when adding an account the wallet automatically sets it as the active account after subscription', (done) => {
		const wallet = Wallet.create({ accounts: [] })

		wallet.observeActiveAccount().subscribe((active) => {
			expect(active.accountId.accountIdString).toBe(
				pk1.publicKey().toString(),
			)
			done()
		})

		const pk1 = generatePrivateKey()
		const addResult = wallet.addAccountByPrivateKey(pk1)
		expect(addResult.isOk()).toBe(true)
	})

	it('for empty wallets when adding an account the wallet automatically sets it as the active account even before subscription', (done) => {
		const wallet = Wallet.create({ accounts: [] })

		const pk1 = generatePrivateKey()
		const addResult = wallet.addAccountByPrivateKey(pk1)
		expect(addResult.isOk()).toBe(true)
		wallet.observeActiveAccount().subscribe((active) => {
			expect(active.accountId.accountIdString).toBe(
				pk1.publicKey().toString(),
			)
			done()
		})
	})

	it('can list all accounts that has been added', (done) => {
		const wallet = Wallet.create({ accounts: [] })
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
		const addResult = wallet.addAccountByPrivateKey(pk1)

		addResult.match(
			() => {
				throw Error('expected error, but got none')
			},
			(e) => expect(e.message).toBe(`Account already added in wallet.`),
		)

		wallet.observeAccounts().subscribe((result) => {
			expect(result.all.length).toBe(1)
			done()
		})
	})

	it('can add hd accounts', (done) => {
		const wallet = Wallet.create({ accounts: [] })
		const hdPath = BIP44.create({ address: { index: 237 } })

		const hdAccount = Account.fromHDPathWithHardwareWallet({
			hdPath,
			onHardwareWalletConnect: EMPTY,
		})

		const addResult = wallet.addAccount(hdAccount)
		expect(addResult.isOk()).toBe(true)

		wallet.observeActiveAccount().subscribe((active) => {
			expect(active.accountId.accountIdString).toBe(
				`m/44'/536'/0'/0/237'`,
			)
			done()
		})
	})
})
