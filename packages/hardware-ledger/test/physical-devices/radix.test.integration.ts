/**
 * @group integration
 */

/* eslint-disable */

import { log } from '@radixdlt/util'
import { Observable, Subscription } from 'rxjs'
import { Radix, SigningKeychain, Wallet, WalletT } from '@radixdlt/application'
import { Mnemonic } from '@radixdlt/crypto'
import { SigningKeyTypeHDT, SigningKeyTypeIdentifier } from '@radixdlt/account'
import {
	HDSigningKeyTypeIdentifier,
	HWSigningKeyDerivation,
} from '@radixdlt/account/src/_types'
import { Network } from '@radixdlt/primitives'
import { HardwareWalletT } from '@radixdlt/hardware-wallet'
import { HardwareWalletLedger } from '../../src'
import { DeriveHWSigningKeyInput } from '@radixdlt/account'

// @ts-ignore
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'

describe('radix_hw_ledger', () => {
	beforeAll(() => {
		log.setLevel('debug')
	})

	const makeWallet = (): WalletT => {
		const signingKeychain = SigningKeychain.create({
			mnemonic: Mnemonic.generateNew(), // not used
		})
		return Wallet.create({
			signingKeychain,
			network: Network.BETANET,
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
		const transport = await TransportNodeHid.create()

		const subs = new Subscription()

		const radix = Radix.create().withWallet(wallet)

		const keyDerivation: HWSigningKeyDerivation = 'next'
		const hardwareWalletConnection: Observable<HardwareWalletT> = HardwareWalletLedger.create(
			transport as any,
		)

		const input: DeriveHWSigningKeyInput = {
			keyDerivation,
			hardwareWalletConnection,
			alsoSwitchTo: true,
		}

		subs.add(
			radix.deriveHWAccount(input).subscribe({
				next: account => {
					expect(account.hdPath!.toString()).toBe(
						`m/44'/1022'/0'/0/0'`,
					)

					const publicKeyCompressedHex = account.publicKey.toString(
						true,
					)
					if (
						publicKeyCompressedHex ===
						'03bc2ec8f3668c869577bf66b7b48f8dee57b833916aa70966fa4a5029b63bb18f'
					) {
						done(
							new Error(
								`Implementation discrepancy between C code for Ledger Nano and this JS Lib. We, here in JS land, expected Ledger Nano app to respect the of hardening the 5th component 'addressIndex' if we explicitly state that (in 'signinKeychain.ts' method: 'deriveHWSigningKey' for input 'next'). But Ledger nano seems to ignore that input, because we got the publickey for the BIP32 path: "m/44'/1022'/0'/0/0" instead of "m/44'/1022'/0'/0/0'", i.e. HARDENING of address index got ignored.`,
							),
						)
						return
					}

					expect(publicKeyCompressedHex).toBe(
						'03f43fba6541031ef2195f5ba96677354d28147e45b40cde4662bec9162c361f55',
					)

					expect(account.address.toString()).toBe(
						'brx1qsplg0a6v4qsx8hjr904h2txwu6562q50ezmgrx7ge3tajgk9smp74gh62u3y',
					)
					expect(account.network).toBe(Network.BETANET)
					expect(account.type.isHardwareSigningKey).toBe(true)
					expect(account.type.isHDSigningKey).toBe(true)
					expect(account.type.typeIdentifier).toBe(
						SigningKeyTypeIdentifier.HD_SIGNING_KEY,
					)
					expect(
						(account.type as SigningKeyTypeHDT).hdSigningKeyType,
					).toBe(HDSigningKeyTypeIdentifier.HARDWARE_OR_REMOTE)
					expect(account.type.uniqueKey).toBe(
						`Hardware_HD_signingKey_at_path_m/44'/1022'/0'/0/0'`,
					)
					done()
				},
				error: e => done(e),
			}),
		)
	}, 20_000)
})
