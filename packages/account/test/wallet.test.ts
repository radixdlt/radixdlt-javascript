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
			const a0 = result.get(pk1.publicKey())!
			expect(a0!.accountId.accountIdString).toBe(publicKey.toString())
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
})
