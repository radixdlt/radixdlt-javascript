import { KeystoreT, Mnemonic, PrivateKey } from '@crypto'
import { SigningKeychain } from '@account'
import { log, LogLevel } from '@util'
import { uint256FromUnsafe } from '@primitives'
import { firstValueFrom } from 'rxjs'
import { HardwareWalletLedger, LedgerNano } from '@hardware-ledger'
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid'

export const sendAPDU = async (
  cla: number,
  ins: number,
  p1: number,
  p2: number,
  data?: Buffer,
  statusList?: readonly number[],
) => {
  const devices = await TransportNodeHid.list()
  if (!devices[0]) {
    throw new Error('No device found.')
  }

  const transport = await TransportNodeHid.create()
  const result = await transport.send(cla, ins, p1, p2, data)
  transport.close()
  return result
}

describe('signing key flow', () => {
  beforeAll(() => {
    log.setLevel(LogLevel.DEBUG)
  })
  it.only('flow', async () => {
    const mnemonic = Mnemonic.generateNew()
    const password = 'superSecret'
    let encryptedKs: KeystoreT

    const result = await SigningKeychain.byEncryptingMnemonicAndSavingKeystore({
      mnemonic,
      password,
      save: (keystore: KeystoreT) => {
        encryptedKs = keystore
        return Promise.resolve()
      },
    })

    const skc = result._unsafeUnwrap()

    skc.deriveNextLocalHDSigningKey()

    const signedResult = await skc.sign({
      blob: '0d0001077ca58b11a07c6817891d91f2127da9b9c3b72e1bc7978d845ae39688a9d6ed6a00000001010021000000000000000000000000000000000000000000000000000101ed50bab180000200450600040279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f8179801000000000000000000000000000000000000000000000104ce0fd391c09bdbca000800000200450600040279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f8179801000000000000000000000000000000000000000000000104c02f1cde1937dbca02004506000402f9308a019258c31049344f85f89d5229b531c845836f99b08601f113bce036f9010000000000000000000000000000000000000000000000000de0b6b3a764000000',
      hashOfBlobToSign:
        '81a79a45724f6c6bd56e076dcb4177cc2d0c2b19447c522ee7dd7b021b9b2282',
    })

    if (signedResult.isErr()) {
      const signError = signedResult._unsafeUnwrapErr()
      log.error(signError)
      expect(false).toBe(true)
    }

    const pk = PrivateKey.fromScalar(uint256FromUnsafe(1)._unsafeUnwrap())

    console.log(pk._unsafeUnwrap().publicKey().toString())

    const sk = await firstValueFrom(skc.observeActiveSigningKey())
    const sks = await firstValueFrom(skc.observeSigningKeys())

    console.log(sks.size())

    console.log(
      (await firstValueFrom(sk.getPublicKeyDisplayOnlyAddress())).__hex,
    )

    expect(mnemonic.phrase).toEqual(skc.revealMnemonic().phrase)

    const ledgerNano = await LedgerNano.connect({
      send: sendAPDU,
    })
    const hardwareWallet = HardwareWalletLedger.from(ledgerNano)
  })
})
