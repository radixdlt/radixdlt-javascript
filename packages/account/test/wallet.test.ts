import { Keystore } from '@radixdlt/crypto'
import { Observable, of } from 'rxjs'
import { WalletT } from '../src/_types'
import { Wallet } from '../src/wallet'
import { Mnemomic } from '../src/bip39/mnemonic'
import { HDMasterSeed } from '../src/bip39/hdMasterSeed'
import { HDMasterSeedT } from '../src/bip39/_types'
import { AccountT, MasterSeedProviderT } from '../dist/_types'
import { MasterSeedProvider } from '../dist/hdMasterNodeProvider'
import { share, skipUntil, skipWhile, take, takeLast, toArray } from "rxjs/operators";
import { Int32 } from '../dist/bip32/_types'

const createWallet = (): WalletT => {
	const mnemonic = Mnemomic.generateNew()
	const masterSeed: HDMasterSeedT = HDMasterSeed.fromMnemonic({ mnemonic })
	const masterSeedProvider: MasterSeedProviderT = {
		masterSeed: (): Observable<HDMasterSeedT> => of(masterSeed).pipe(share()),
	}
	return Wallet.create({ masterSeedProvider })
}

describe('HD Wallet', () => {
	it('can be created via keystore', async (done) => {
		const mnemonic = Mnemomic.generateNew()
		const masterSeed: HDMasterSeedT = HDMasterSeed.fromMnemonic({
			mnemonic,
		})
		const password = 'super secret password'
		const keystoreResult = await Keystore.encryptSecret({
			secret: masterSeed.seed,
			password,
		}).map((keystore) => {
			// Save 'keystore' as .json file on disc
			const masterSeedProvider = MasterSeedProvider.withKeyStore({
				keystore,
				password,
			})
			return Wallet.create({ masterSeedProvider })
		})

		keystoreResult.match(
			(wallet) => {
				expect(wallet).toBeDefined()
				done()
			},
			(e) => done(e),
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
})
