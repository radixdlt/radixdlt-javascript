/**
 * @group integration
 */

/* eslint-disable */

import { log } from '@radixdlt/util'
import { Observable, Subscription } from 'rxjs'
import { SigningKeychain, SigningKeychainT } from '@radixdlt/account'
import { Mnemonic } from '@radixdlt/crypto'
import { DeriveHWSigningKeyInput } from '@radixdlt/account/dist/_types'
import { HardwareWalletT } from '@radixdlt/hardware-wallet'
import { HWSigningKeyDerivation } from '@radixdlt/account/src/_types'
import { HardwareWalletLedger } from '../../dist'

describe('signingKeychain_hw_ledger', () => {
	beforeAll(() => {
		log.setLevel('debug')
	})

	const makeKeychain = (): SigningKeychainT => {
		return SigningKeychain.create({
			mnemonic: Mnemonic.generateNew(), // not used
		})
	}

	let keychain: SigningKeychainT

	beforeEach(() => {
		keychain = makeKeychain()
	})

	afterAll(() => {
		log.setLevel('warn')
	})

	it('deriveHWSigningKey', async done => {
		const subs = new Subscription()

		const keyDerivation: HWSigningKeyDerivation = 'next'
		const hardwareWalletConnection: Observable<HardwareWalletT> = HardwareWalletLedger.create()

		const input: DeriveHWSigningKeyInput = {
			keyDerivation,
			hardwareWalletConnection,
		}

		subs.add(
			keychain.deriveHWSigningKey(input).subscribe({
				next: sk => {
					expect(sk.hdPath!.toString()).toBe(`m/44'/536'/0'/0/0'`)

					const publicKeyCompressedHex = sk.publicKey.toString(true)
					if (
						publicKeyCompressedHex ===
						'021d15f715b83b2067cb241a9ba6257cbcb145f4a635c9f73b56f72e658950241e'
					) {
						done(
							new Error(
								`Implementation discrepancy between C code for Ledger Nano and this JS Lib. We, here in JS land, expected Ledger Nano app to respect the of hardening the 5th component 'addressIndex' if we explicitly state that (in 'signinKeychain.ts' method: 'deriveHWSigningKey' for input 'next'). But Ledger nano seems to ignore that input, because we got the publickey for the BIP32 path: "m/44'/536'/0'/0/0" instead of "m/44'/536'/0'/0/0'", i.e. HARDENING of address index got ignored.`,
							),
						)
						return
					}

					expect(publicKeyCompressedHex).toBe(
						'02486d8128388446ac8c239d0a615a5bcfd1ebbecce5c8704f68876187a18679d8',
					)
					done()
				},
				error: e => done(e),
			}),
		)
	}, 20_000)
})
