/**
 * @group integration
 */

/* eslint-disable */

import { log } from '@radixdlt/util'
import { Subscription } from 'rxjs'
import { Radix, SigningKeychain, Wallet, WalletT } from '@radixdlt/application'
import { Mnemonic } from '@radixdlt/crypto'
import { SigningKeyTypeHDT, SigningKeyTypeIdentifier } from '@radixdlt/account'
import { HDSigningKeyTypeIdentifier } from '@radixdlt/account/src/_types'
import { NetworkT } from '@radixdlt/primitives'

describe('radix_hardware_wallet', () => {
	beforeAll(() => {
		log.setLevel('debug')
	})

	const makeWallet = (): WalletT => {
		const signingKeychain = SigningKeychain.create({
			mnemonic: Mnemonic.generateNew(), // not used
		})
		return Wallet.create({
			signingKeychain,
			network: NetworkT.BETANET,
		})
	}

	let wallet: WalletT

	beforeEach(() => {
		wallet = makeWallet()
	})

	afterAll(() => {
		log.setLevel('warn')
	})

	it('wallet_derive_hw_account', async done => {
		const subs = new Subscription()

		const radix = Radix.create().withWallet(wallet)

		subs.add(
			radix.deriveHWAccount('next').subscribe({
				next: account => {
					expect(account.hdPath!.toString()).toBe(
						`m/44'/536'/0'/0/0'`,
					)

					const publicKeyCompressedHex = account.publicKey.toString(
						true,
					)
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

					expect(account.address.toString()).toBe(
						'brx1qspysmvp9qugg34v3s3e6znptfdul50thmxwtjrsfa5gwcv85xr8nkq06tlv7',
					)
					expect(account.network).toBe(NetworkT.BETANET)
					expect(account.type.isHardwareSigningKey).toBe(true)
					expect(account.type.isHDSigningKey).toBe(true)
					expect(account.type.typeIdentifier).toBe(
						SigningKeyTypeIdentifier.HD_SIGNING_KEY,
					)
					expect(
						(account.type as SigningKeyTypeHDT).hdSigningKeyType,
					).toBe(HDSigningKeyTypeIdentifier.HARDWARE_OR_REMOTE)
					expect(account.type.uniqueKey).toBe(
						`Hardware_HD_signingKey_at_path_m/44'/536'/0'/0/0'`,
					)
					done()
				},
				error: e => done(e),
			}),
		)
	}, 20_000)
})
