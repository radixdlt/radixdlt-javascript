import { BIP32T, HDMasterSeed, HDNodeT, MnemomicT, SignatureT } from '@crypto'
import { BuiltTransactionReadyToSign } from '@primitives'
import { ResultAsync } from 'neverthrow'
import {
  BehaviorSubject,
  firstValueFrom,
  Observable,
  ReplaySubject,
  Subscription,
} from 'rxjs'
import { mergeMap, shareReplay, tap } from 'rxjs/operators'
import { SigningKeysT, SigningKeyT } from '../../signing-key/_types'
import { SigningKeychainT } from '../_types'
import { CreateSigningKeychainInput, MutableSigningKeysT } from '../_types'
import { createSigningKeys } from './createSigningKeys'
import { deriveNextLocalHDSigningKey as _deriveNextLocalHDSigningKey } from './deriveNextLocalHDSigningKey'
import { deriveHWSigningKey as _deriveHWSigningKey } from './deriveHWSigningKey'
import { switchSigningKey as _switchSigningKey } from './switchSigningKey'
import { restoreLocalHDSigningKeysUpToIndex as _restoreLocalHDSigningKeysUpToIndex } from './restoreLocalHDSigningKeysUpToIndex'
import { addSigningKeyFromPrivateKey as _addSigningKeyFromPrivateKey } from './addSigningKeyFromPrivateKey'
import { deriveLocalHDSigningKeyWithPath as _deriveLocalHDSigningKeyWithPath } from './deriveLocalHDSigningKeyWithPath'
import { addAndMaybeSwitchToNewSigningKey as _addAndMaybeSwitchToNewSigningKey } from './addAndMaybeSwitchToNewSigningKey'

export const createSigningKeychain = (
  input: CreateSigningKeychainInput,
): SigningKeychainT => {
  const startWithInitialSigningKey = input.startWithInitialSigningKey ?? true
  const { mnemonic } = input
  const masterSeed = HDMasterSeed.fromMnemonic({ mnemonic })

  const activeSigningKeySubject = new ReplaySubject<SigningKeyT>()
  const signingKeysSubject = new BehaviorSubject<MutableSigningKeysT>(
    createSigningKeys(),
  )

  const activeSigningKey$ = activeSigningKeySubject.asObservable()
  const signingKeys$ = signingKeysSubject.asObservable().pipe(shareReplay())

  const subs = new Subscription()

  const hdNodeDeriverWithBip32Path: (path: BIP32T) => HDNodeT =
    masterSeed.masterNode().derive

  const numberOfAllSigningKeys = (): number =>
    signingKeysSubject.getValue().size()

  const numberOfLocalHDSigningKeys = (): number =>
    signingKeysSubject.getValue().localHDSigningKeys().length

  const numberOfHWSigningKeys = (): number =>
    signingKeysSubject.getValue().hardwareHDSigningKeys().length

  const setActiveSigningKey = (newSigningKey: SigningKeyT): void => {
    activeSigningKeySubject.next(newSigningKey)
  }

  const deriveLocalHDSigningKeyWithPath = _deriveLocalHDSigningKeyWithPath(
    signingKeysSubject,
    setActiveSigningKey,
    hdNodeDeriverWithBip32Path,
  )

  const addAndMaybeSwitchToNewSigningKey = _addAndMaybeSwitchToNewSigningKey(
    signingKeysSubject,
    setActiveSigningKey,
  )

  const deriveNextLocalHDSigningKey = _deriveNextLocalHDSigningKey(
    numberOfLocalHDSigningKeys,
    deriveLocalHDSigningKeyWithPath,
  )

  const deriveHWSigningKey = _deriveHWSigningKey(
    numberOfHWSigningKeys,
    addAndMaybeSwitchToNewSigningKey,
  )

  const switchSigningKey = _switchSigningKey(
    numberOfAllSigningKeys,
    signingKeysSubject,
    setActiveSigningKey,
  )

  const restoreLocalHDSigningKeysUpToIndex =
    _restoreLocalHDSigningKeysUpToIndex(
      numberOfLocalHDSigningKeys,
      signingKeys$,
      deriveLocalHDSigningKeyWithPath,
    )

  const addSigningKeyFromPrivateKey = _addSigningKeyFromPrivateKey(
    addAndMaybeSwitchToNewSigningKey,
  )

  if (startWithInitialSigningKey) {
    subs.add(
      deriveNextLocalHDSigningKey({
        alsoSwitchTo: true,
      }).subscribe(),
    )
  }

  return {
    revealMnemonic: (): MnemomicT => mnemonic,
    deriveNextLocalHDSigningKey,
    deriveHWSigningKey,
    switchSigningKey,
    restoreLocalHDSigningKeysUpToIndex,
    addSigningKeyFromPrivateKey,
    observeSigningKeys: (): Observable<SigningKeysT> => signingKeys$,
    observeActiveSigningKey: (): Observable<SigningKeyT> => activeSigningKey$,
    sign: (tx: BuiltTransactionReadyToSign, nonXrdHRP?: string) =>
      ResultAsync.fromPromise(
        firstValueFrom(activeSigningKey$),
        e => e as Error,
      ).andThen(key => key.sign(tx, nonXrdHRP)),
    signHash: (hashedMessage: Buffer): Observable<SignatureT> =>
      activeSigningKey$.pipe(mergeMap(a => a.signHash(hashedMessage))),
  }
}
