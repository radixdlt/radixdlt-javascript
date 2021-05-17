/**
 * @group integration
 */

/* eslint-disable */


import { LedgerNanoT } from '@radixdlt/hardware-wallet'
import { log } from '@radixdlt/util/dist/logging'
import { Subscription } from 'rxjs'
import { SigningKeychain, SigningKeychainT } from '../../src'
import { Mnemonic } from '@radixdlt/crypto'

describe.skip('signingKey_ledger', () => {
	// let ledgerNano: LedgerNanoT
	beforeAll(() => {
		log.setLevel('debug')
	})

	const makeKeychain = (): SigningKeychainT => {
		return SigningKeychain.create({
			mnemonic: Mnemonic.generateNew() // not used
		})
	}

	let keychain: SigningKeychainT

	beforeEach(() => {
		keychain = makeKeychain()
	})

	// afterEach((done) => {
	// 	if (!ledgerNano) {
	// 		done()
	// 		return
	// 	}
	// 	const subs = new Subscription()
	// 	// must close connection in between else finding a free ledger device for subsequent test will fail.
	// 	subs.add(
	// 		ledgerNano.close().subscribe(() => {
	// 			done()
	// 		}),
	// 	)
	// })

	afterAll(() => {
		log.setLevel('warn')
	})



	it('doSignHash_integration', async (done) => {
		const subs = new Subscription()

		subs.add(
		keychain.deriveHWSigningKey('next').subscribe({
			next: (sk) => {
				expect(sk.hdPath!.toString()).toBe(`m/44'/536'/0'/0/0`)
				done()
			},
			error: (e) => done(e)
		}))

		// ledgerNano = await LedgerNano.connect({
		// 	deviceConnectionTimeout: 1_000,
		// })
		// const hardwareWallet = HardwareWallet.ledger(ledgerNano)
		//
		// testDoSignHash({
		// 	hardwareWallet,
		// 	onResponse: (_signature) => {
		// 		done()
		// 	},
		// })
	}, 20_000)
})
