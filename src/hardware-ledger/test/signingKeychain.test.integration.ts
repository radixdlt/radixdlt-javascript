/**
 * @group integration
 */

/* eslint-disable */

import { log } from '@util'
import { Observable, Subscription } from 'rxjs'
import { SigningKeychain, SigningKeychainT } from '@account'
import { Mnemonic } from '@crypto'
import { DeriveHWSigningKeyInput } from '@account'
import { HardwareWalletT } from '@hardware-wallet'
import { HWSigningKeyDerivation } from '@account'
import { HardwareWalletLedger } from '../'
import { sendAPDU } from './utils'

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

  it('deriveHWSigningKey', done => {
    const subs = new Subscription()

    const keyDerivation: HWSigningKeyDerivation = 'next'
    const hardwareWalletConnection: Observable<HardwareWalletT> =
      HardwareWalletLedger.create({
        send: sendAPDU,
      })

    const input: DeriveHWSigningKeyInput = {
      keyDerivation,
      hardwareWalletConnection,
      alsoSwitchTo: true,
    }

    subs.add(
      keychain.deriveHWSigningKey(input).subscribe({
        next: sk => {
          expect(sk.hdPath!.toString()).toBe(`m/44'/1022'/0'/0/0'`)

          const publicKeyCompressedHex = sk.publicKey.toString(true)
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
          done()
        },
        error: e => done(e),
      }),
    )
  }, 20_000)
})
