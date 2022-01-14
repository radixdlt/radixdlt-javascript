/**
 * @group integration
 */

/* eslint-disable */

import { SemVerT, SignTXOutput } from '@hardware-wallet'
import { log } from '@util'
import { firstValueFrom, Subscription } from 'rxjs'
import { LedgerNanoT, LedgerNano, HardwareWalletLedger } from '../'
import {
  ECPointOnCurveT,
  HDPathRadix,
  PublicKey,
  PublicKeyT,
  sha256Twice,
  SignatureT,
} from '@crypto'
import {
  BuiltTransactionReadyToSign,
  Network,
  uint256FromUnsafe,
} from '@primitives'
import { Transaction, stringifyUInt256, TransactionT } from '@tx-parser'
import { AccountAddress } from '@account'
import { sendAPDU } from './utils'

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
  })

  afterAll(() => {
    log.setLevel('warn')
  })

  it('getVersion_integration', async () => {
    ledgerNano = await LedgerNano.connect({
      send: sendAPDU,
    })
    const hardwareWallet = HardwareWalletLedger.from(ledgerNano)

    const semVer = await firstValueFrom(hardwareWallet.getVersion())

    expect(semVer.toString()).toBe('0.3.7')
  })

  it('getPublicKey_integration', async () => {
    ledgerNano = await LedgerNano.connect({
      send: sendAPDU,
    })
    const hardwareWallet = HardwareWalletLedger.from(ledgerNano)

    const path = HDPathRadix.fromString(`m/44'/1022'/2'/1/3`)._unsafeUnwrap()
    const displayAddress = true

    const expectedPubKeyHex =
      '03d79039c428a6b835e136fbb582e9259df23f8660f928367c3f0d6912728a8444'

    const expectedPubKey = PublicKey.fromBuffer(
      Buffer.from(expectedPubKeyHex, 'hex'),
    )._unsafeUnwrap()

    if (displayAddress) {
      console.log(`🔮 expected path: ${path.toString()}`)
      const accountAddress = AccountAddress.fromPublicKeyAndNetwork({
        publicKey: expectedPubKey,
        network: Network.MAINNET,
      })
      const wrongAccountAddress = AccountAddress.fromPublicKeyAndNetwork({
        publicKey: expectedPubKey,
        network: Network.MAINNET,
      })
      console.log(
        `🔮 expected address: '${accountAddress.toString()}' ([wrong]mainnet: '${wrongAccountAddress.toString()}')`,
      )
    }

    const publicKey = firstValueFrom(
      hardwareWallet.getPublicKey({
        path,
        display: displayAddress,
      }),
    )

    expect(publicKey.toString()).toBe(expectedPubKeyHex)
  })

  it('doKeyExchange_integration', async () => {
    ledgerNano = await LedgerNano.connect({
      send: sendAPDU,
    })
    const hardwareWallet = HardwareWalletLedger.from(ledgerNano)

    const publicKeyOfOtherParty = PublicKey.fromBuffer(
      Buffer.from(
        '0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8',
        'hex',
      ),
    )._unsafeUnwrap()

    const displayBIPAndPubKeyOtherParty = true

    if (displayBIPAndPubKeyOtherParty) {
      console.log(
        `🔮 publicKeyOfOtherParty: ${publicKeyOfOtherParty.toString(false)}`,
      )

      const accountAddressOfOtherParty = AccountAddress.fromPublicKeyAndNetwork(
        {
          publicKey: publicKeyOfOtherParty,
          network: Network.MAINNET,
        },
      )

      console.log(
        `🔮 other party address: ${accountAddressOfOtherParty.toString()}`,
      )
    }

    const ecPointOnCurve = await firstValueFrom(
      hardwareWallet.keyExchange({
        // both Account and Address will be hardened.
        path: HDPathRadix.fromString(`m/44'/1022'/2'/1/3`)._unsafeUnwrap(),
        publicKeyOfOtherParty,
        display: 'encrypt',
      }),
    )

    expect(ecPointOnCurve.toString()).toBe(
      'd79039c428a6b835e136fbb582e9259df23f8660f928367c3f0d6912728a8444a87d3a07191942666ca3d0396374531fe669e451bae6eeb79fb0884ef78a2f9d',
    )
  }, 20_000)

  it(
    'doSignTX_integration',
    async () => {
      ledgerNano = await LedgerNano.connect({
        send: sendAPDU,
      })
      const hardwareWallet = HardwareWalletLedger.from(ledgerNano)

      const path = HDPathRadix.fromString(`m/44'/1022'/2'/1/3`)._unsafeUnwrap()

      const expectedPubKeyHex =
        '03d79039c428a6b835e136fbb582e9259df23f8660f928367c3f0d6912728a8444'
      const expectedPubKey = PublicKey.fromBuffer(
        Buffer.from(expectedPubKeyHex, 'hex'),
      )._unsafeUnwrap()

      const blobHex =
        '0d000107a0686a487f9d3adf4892a358e4460cda432068f069e5e9f4c815af21bc3dd1d600000000012100000000000000000000000000000000000000000000000abbade0b6b3a76400000206000402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca0100000000000000000000000000000000000000000000d3c1e44bf21f037000000008000000000206000402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca0100000000000000000000000000000000000000000000d38bae82445924d00000020600040356959464545aa2787984fe4ac76496721a22f150c0076724ad7190fe3a597bb70100000000000000000000000000000000000000000000003635c9adc5dea00000000121010000000000000000000000000000000000000000000000000de0b6b3a76400000206000402935deebcad35bcf27d05b431276be8fcba26312cd1d54c33ac6748a72fe427ca010000000000000000000000000000000000000000000000000de0b6b3a764000000'
      const blob = Buffer.from(blobHex, 'hex')
      const txRes = Transaction.fromBuffer(blob)
      if (txRes.isErr()) {
        throw txRes.error
      }
      const parsedTx: TransactionT = txRes.value

      const expectedHash = sha256Twice(Buffer.from(blobHex, 'hex'))
      const tx: BuiltTransactionReadyToSign = {
        blob: blobHex,
        hashOfBlobToSign: expectedHash.toString('hex'),
      }

      console.log(`🔮 Path: ${path.toString()}`)
      console.log(`🔮 Expected Hash: ${expectedHash.toString('hex')}`)
      console.log(`🔮 Signing tx:\n${parsedTx.toString()}`)

      const totalCostDecATTOString = '2048463735185526206758912'
      const totalCost = uint256FromUnsafe(
        totalCostDecATTOString,
      )._unsafeUnwrap()
      console.log(
        `🔮 Expected total cost incl tx fee in XRD: ${stringifyUInt256(
          totalCost,
        )} (atto: ${totalCost.toString(10)})`,
      )

      const result = (
        await hardwareWallet.signTransaction({
          path,
          nonXrdHRP: 'btc',
          tx,
        })
      )._unsafeUnwrap()

      const hashCalculatedByLedger = result.hashCalculatedByLedger
      const signature = result.signature

      expect(hashCalculatedByLedger.toString('hex')).toBe(
        expectedHash.toString('hex'),
      )
      expect(
        expectedPubKey.isValidSignature({
          signature,
          hashedMessage: hashCalculatedByLedger,
        }),
      ).toBe(true)
    },
    10 * 60 * 1_000,
  ) // 10 min

  it('doSignHash_integration', async () => {
    ledgerNano = await LedgerNano.connect({
      send: sendAPDU,
    })
    const hardwareWallet = HardwareWalletLedger.from(ledgerNano)

    const hashToSign = sha256Twice(`I'm testing Radix awesome hardware wallet!`)

    const path = HDPathRadix.fromString(`m/44'/1022'/2'/1/3`)._unsafeUnwrap()

    console.log(`🔮 Path: ${path.toString()}`)
    console.log(`🔮 Hash: ${hashToSign.toString('hex')}`)

    const signature = await firstValueFrom(
      hardwareWallet.signHash({
        path,
        hashToSign,
      }),
    )

    expect(signature.toDER()).toBe(
      '3045022100de5f8c5a92cc5bea386d7a5321d0aa1b46fc7d90c5d07098346252aacd59e52302202bbaeef1256d0185b550a7b661557eea11bb98b99ccc7e01d19fd931e617e824',
    )
  }, 40_000)
})
