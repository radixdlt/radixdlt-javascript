import { HDPathRadix, Int32 } from '@crypto'
import { Observable } from 'rxjs'
import { SigningKeyT } from '../../signing-key/_types'
import { DeriveLocalHDSigningKeyWithPathInput } from './deriveLocalHDSigningKeyWithPath'

export type DeriveNextLocalHDSigningKeyAtIndex = {
  addressIndex: {
    index: Int32
    isHardened?: boolean // defaults to true
  }
  alsoSwitchTo?: boolean // defaults to false
}

export const deriveNextLocalHDSigningKeyAtIndex =
  (deriveLocalHDSigningKeyWithPath: DeriveLocalHDSigningKeyWithPathInput) =>
  (input: DeriveNextLocalHDSigningKeyAtIndex): Observable<SigningKeyT> =>
    deriveLocalHDSigningKeyWithPath({
      hdPath: HDPathRadix.create({
        address: input.addressIndex,
      }),
      alsoSwitchTo: input.alsoSwitchTo,
    })
