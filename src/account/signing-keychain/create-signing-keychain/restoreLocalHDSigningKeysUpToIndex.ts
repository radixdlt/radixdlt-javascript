import {
  combineLatest,
  mergeMap,
  Observable,
  throwError,
} from 'rxjs'
import { take } from 'rxjs/operators'
import { SigningKeysT, SigningKeyT } from '../../signing-key/_types'
import { MutableSigningKeysT } from '../_types'
import { DeriveLocalHDSigningKeyWithPathInput } from './deriveLocalHDSigningKeyWithPath'
import { deriveNextLocalHDSigningKeyAtIndex } from './deriveNextLocalHDSigningKeyAtIndex'

export const restoreLocalHDSigningKeysUpToIndex =
  (
    numberOfLocalHDSigningKeys: () => number,
    signingKeys$: Observable<MutableSigningKeysT>,
    deriveLocalHDSigningKeyWithPath: DeriveLocalHDSigningKeyWithPathInput,
  ) =>
  (index: number): Observable<SigningKeysT> => {
    if (index < 0) {
      const errMsg = `targetIndex must not be negative`
      console.error(errMsg)
      return throwError(() => new Error(errMsg))
    }

    const localHDSigningKeysSize = numberOfLocalHDSigningKeys()
    const numberOfSigningKeysToCreate = index - localHDSigningKeysSize
    if (numberOfSigningKeysToCreate < 0) {
      return signingKeys$
    }

    const signingKeysObservableList: Observable<SigningKeyT>[] = Array(
      numberOfSigningKeysToCreate,
    )
      .fill(undefined)
      .map((_, index) =>
        deriveNextLocalHDSigningKeyAtIndex(deriveLocalHDSigningKeyWithPath)({
          addressIndex: { index: localHDSigningKeysSize + index },
        }),
      )

    return combineLatest(signingKeysObservableList).pipe(
      mergeMap(_ => signingKeys$),
      take(1),
    )
  }
