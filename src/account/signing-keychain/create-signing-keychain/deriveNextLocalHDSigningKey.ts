import { DeriveNextInput, MutableSigningKeysT } from '../_types'
import { deriveNextLocalHDSigningKeyAtIndex } from './deriveNextLocalHDSigningKeyAtIndex'
import { SigningKeyT } from '../../signing-key/_types'
import { Observable } from 'rxjs'
import { DeriveLocalHDSigningKeyWithPathInput } from './deriveLocalHDSigningKeyWithPath'

export const deriveNextLocalHDSigningKey =
  (
    numberOfLocalHDSigningKeys: () => number,
    deriveLocalHDSigningKeyWithPath: DeriveLocalHDSigningKeyWithPathInput,
  ) =>
  (input?: DeriveNextInput): Observable<SigningKeyT> => {
    const index = numberOfLocalHDSigningKeys()
    return deriveNextLocalHDSigningKeyAtIndex(deriveLocalHDSigningKeyWithPath)({
      addressIndex: {
        index,
        isHardened: input?.isHardened ?? true,
      },
      alsoSwitchTo: input?.alsoSwitchTo,
    })
  }
