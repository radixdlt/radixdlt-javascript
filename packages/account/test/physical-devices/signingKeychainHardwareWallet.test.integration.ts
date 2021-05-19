/**
 * @group integration
 */

/* eslint-disable */

import { log } from '@radixdlt/util'
import { Subscription } from 'rxjs'
import { SigningKeychain, SigningKeychainT } from '../../src'
import { Mnemonic } from '@radixdlt/crypto'

describe('signingKey_ledger', () => {
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

	it('deriveHWSigningKey', async (done) => {
		const subs = new Subscription()

		subs.add(
			keychain.deriveHWSigningKey('next').subscribe({
				next: (sk) => {
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
				error: (e) => done(e),
			}),
		)
	}, 20_000)
})
