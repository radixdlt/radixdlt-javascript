/**
 * @group integration
 */
import { log } from '@util'
import { Observable, Subscription } from 'rxjs'
import { Radix, SigningKeychain, Wallet, WalletT } from '@application'
import { Mnemonic } from '@crypto'
import { SigningKeyTypeHDT, SigningKeyTypeIdentifier } from '@account'
import {
	HDSigningKeyTypeIdentifier,
	HWSigningKeyDerivation,
} from '@account'
import { Network } from '@primitives'
import { HardwareWalletT } from '@hardware-wallet'
import { HardwareWalletLedger } from '..'
import { DeriveHWSigningKeyInput } from '@account'
import { sendAPDU } from './utils'

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
			network: Network.MAINNET,
		})
	}

	let wallet: WalletT

	beforeEach(() => {
		wallet = makeWallet()
	})

	afterAll(() => {
		log.setLevel('warn')
	})

	it('wallet_derive_hw_account', done => {
		const subs = new Subscription()

		const radix = Radix.create().__withWallet(wallet)

		const keyDerivation: HWSigningKeyDerivation = 'next'
		const hardwareWalletConnection: Observable<HardwareWalletT> = HardwareWalletLedger.create(
			{
				send: sendAPDU,
			},
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
					expect(account.network).toBe(Network.MAINNET)
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
