import { BIP32T, HDNodeT, HDPathRadixT } from '@crypto'
import { BehaviorSubject, Observable, of } from 'rxjs'
import { addAndMaybeSwitchToNewSigningKey } from './addAndMaybeSwitchToNewSigningKey'
import { SigningKeyT } from '../../signing-key/_types'
import { SigningKey } from '../../signing-key/signingKey'
import { MutableSigningKeysT } from '../_types'

export type DeriveLocalHDSigningKeyWithPathInput = ReturnType<
  typeof deriveLocalHDSigningKeyWithPath
>

export const deriveLocalHDSigningKeyWithPath =
  (
    signingKeysSubject: BehaviorSubject<MutableSigningKeysT>,
    setActiveSigningKey: (newSigningKey: SigningKeyT) => void,
    hdNodeDeriverWithBip32Path: (path: BIP32T) => HDNodeT,
  ) =>
  (input: {
    hdPath: HDPathRadixT
    alsoSwitchTo?: boolean // defaults to false
  }): Observable<SigningKeyT> => {
    const { hdPath } = input

    const newSigningKey = addAndMaybeSwitchToNewSigningKey(
      signingKeysSubject,
      setActiveSigningKey,
    )(
      SigningKey.byDerivingNodeAtPath({
        hdPath,
        deriveNodeAtPath: () => hdNodeDeriverWithBip32Path(hdPath),
      }),
      input.alsoSwitchTo,
    )

    return of(newSigningKey)
  }
