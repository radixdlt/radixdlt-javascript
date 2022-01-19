import { KeystoreT, MnemomicT } from '@crypto'
import { Observable } from 'rxjs'
import {
  Signing,
  SigningKeysT,
  SigningKeyT,
  AddSigningKeyByPrivateKeyInput,
} from '../signing-key/_types'
import { HDPathRadixT } from '@crypto'
import { HardwareWalletT } from '@hardware-wallet'

export type HWSigningKeyDerivation = 'next' | HDPathRadixT

export type DeriveHWSigningKeyInput = {
  keyDerivation: HWSigningKeyDerivation
  hardwareWalletConnection: Observable<HardwareWalletT>
  alsoSwitchTo: boolean
  verificationPrompt?: boolean
}

export type DeriveNextInput =
  | undefined
  | {
      isHardened?: boolean // defaults to true
      alsoSwitchTo?: boolean // defaults to false
    }

export type ByEncryptingMnemonicAndSavingKeystoreInput = {
  mnemonic: MnemomicT
  password: string
  save: (keystoreToSave: KeystoreT) => Promise<void>
  startWithInitialSigningKey?: boolean
}

export type FromKeystoreInput = {
  keystore: KeystoreT
  password: string
  startWithInitialSigningKey?: boolean
}

export type CreateSigningKeychainInput = {
  mnemonic: MnemomicT
  startWithInitialSigningKey?: boolean
}

export type MutableSigningKeysT = SigningKeysT & {
  add: (signingKey: SigningKeyT) => void
}

export type SigningKeychainT = Signing & {
  revealMnemonic: () => MnemomicT

  restoreLocalHDSigningKeysUpToIndex: (
    index: number,
  ) => Observable<SigningKeysT>

  deriveNextLocalHDSigningKey: (
    input?: DeriveNextInput,
  ) => Observable<SigningKeyT>

  deriveHWSigningKey: (
    input: DeriveHWSigningKeyInput,
  ) => Observable<SigningKeyT>

  addSigningKeyFromPrivateKey: (
    input: AddSigningKeyByPrivateKeyInput,
  ) => SigningKeyT

  switchSigningKey: (input: SwitchSigningKeyInput) => SigningKeyT

  observeActiveSigningKey: () => Observable<SigningKeyT>

  observeSigningKeys: () => Observable<SigningKeysT>
}

export type SwitchToSigningKey = { toSigningKey: SigningKeyT }

export type SwitchToIndex = { toIndex: number }

export type SwitchSigningKeyInput =
  | 'first'
  | 'last'
  | SwitchToSigningKey
  | SwitchToIndex

export type ByLoadingAndDecryptingKeystoreInput = {
  password: string
  load: () => Promise<KeystoreT>
  startWithInitialSigningKey?: boolean
}
