/**
 * @group integration
 */

/* eslint-disable */

import { HardwareWallet, LedgerNano, LedgerNanoT, SemVerT } from '../../src'
import { log } from '@radixdlt/util'
import { Subscription } from 'rxjs'
import {
	testDoKeyExchange,
	testDoSignHash,
	testGetPublicKey,
	testGetVersion,
} from '../hardwareTestUtils'

describe('hw_ledger_integration', () => {
	let ledgerNano: LedgerNanoT
	beforeAll(() => {
		log.setLevel('debug')
	})

	afterEach(done => {
		if (!ledgerNano) {
			done()
			return
		}
		const subs = new Subscription()
		// must close connection in between else finding a free ledger device for subsequent test will fail.
		subs.add(
			ledgerNano.close().subscribe(() => {
				done()
			}),
		)
	})

	afterAll(() => {
		log.setLevel('warn')
	})

	it('getVersion_integration', async done => {
		ledgerNano = await LedgerNano.connect({
			deviceConnectionTimeout: 1_000,
		})
		const hardwareWallet = HardwareWallet.ledger(ledgerNano)

		testGetVersion({
			hardwareWallet,
			onResponse: (version: SemVerT) => {
				expect(version.toString()).toBe('0.0.1')
				done()
			},
		})
	})

	it('getPublicKey_integration', async done => {
		ledgerNano = await LedgerNano.connect({
			deviceConnectionTimeout: 1_000,
		})
		const hardwareWallet = HardwareWallet.ledger(ledgerNano)

		testGetPublicKey({
			hardwareWallet,
			onResponse: _publicKey => {
				done()
			},
		})
	})

	// Not implemented on Ledger yet
	it.skip('doKeyExchange_integration', async done => {
		ledgerNano = await LedgerNano.connect({
			deviceConnectionTimeout: 1_000,
		})
		const hardwareWallet = HardwareWallet.ledger(ledgerNano)

		testDoKeyExchange({
			hardwareWallet,
			onResponse: _pointOncurve => {
				done()
			},
		})
	}, 20_000)

	it('doSignHash_integration', async done => {
		ledgerNano = await LedgerNano.connect({
			deviceConnectionTimeout: 1_000,
		})
		const hardwareWallet = HardwareWallet.ledger(ledgerNano)

		testDoSignHash({
			hardwareWallet,
			onResponse: _signature => {
				done()
			},
		})
	}, 20_000)
})
