import { BehaviorSubject, Observable } from 'rxjs'
import { DeriveHWSigningKeyInput, MutableSigningKeysT } from '../_types'
import { SigningKeyT } from '../../signing-key/_types'
import { SigningKey } from '../../signing-key/signingKey'
import { HDPathRadix, HDPathRadixT } from '@crypto'
import { mergeMap, map } from 'rxjs/operators'
import { HardwareSigningKeyT, HardwareWalletT } from '@hardware-wallet'
import { AddAndMaybeSwitchToNewSigningKey } from './addAndMaybeSwitchToNewSigningKey'

export const deriveHWSigningKey =
  (
    numberOfHWSigningKeys: () => number,
    addAndMaybeSwitchToNewSigningKey: AddAndMaybeSwitchToNewSigningKey,
  ) =>
  (input: DeriveHWSigningKeyInput): Observable<SigningKeyT> => {
    const nextPath = (): HDPathRadixT => {
      const index = numberOfHWSigningKeys()
      return HDPathRadix.create({
        address: { index, isHardened: true },
      })
    }
    const hdPath: HDPathRadixT =
      input.keyDerivation === 'next' ? nextPath() : input.keyDerivation

    return input.hardwareWalletConnection.pipe(
      mergeMap(
        (hardwareWallet: HardwareWalletT): Observable<HardwareSigningKeyT> =>
          hardwareWallet.makeSigningKey(hdPath, input.verificationPrompt),
      ),
      map((hardwareSigningKey: HardwareSigningKeyT) => {
        const signingKey = SigningKey.fromHDPathWithHWSigningKey({
          hdPath,
          hardwareSigningKey,
        })
        addAndMaybeSwitchToNewSigningKey(signingKey, input.alsoSwitchTo)
        return signingKey
      }),
    )
  }
