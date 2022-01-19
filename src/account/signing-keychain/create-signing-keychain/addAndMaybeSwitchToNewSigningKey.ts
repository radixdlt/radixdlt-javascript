import { BehaviorSubject } from 'rxjs'
import { MutableSigningKeysT } from '../_types'
import { SigningKeyT } from '../../signing-key/_types'

export type AddAndMaybeSwitchToNewSigningKey = ReturnType<
  typeof addAndMaybeSwitchToNewSigningKey
>

export const addAndMaybeSwitchToNewSigningKey =
  (
    signingKeysSubject: BehaviorSubject<MutableSigningKeysT>,
    setActiveSigningKey: (newSigningKey: SigningKeyT) => void,
  ) =>
  (newSigningKey: SigningKeyT, alsoSwitchTo?: boolean): SigningKeyT => {
    const signingKeys = signingKeysSubject.getValue()
    signingKeys.add(newSigningKey)
    signingKeysSubject.next(signingKeys)
    if (alsoSwitchTo) {
      setActiveSigningKey(newSigningKey)
    }
    return newSigningKey
  }
