import {
  AddSigningKeyByPrivateKeyInput,
  SigningKeyT,
} from '../../signing-key/_types'
import { SigningKey } from '../../signing-key/signingKey'
import { AddAndMaybeSwitchToNewSigningKey } from './addAndMaybeSwitchToNewSigningKey'

export const addSigningKeyFromPrivateKey =
  (addAndMaybeSwitchToNewSigningKey: AddAndMaybeSwitchToNewSigningKey) =>
  (input: AddSigningKeyByPrivateKeyInput): SigningKeyT => {
    const signingKey = SigningKey.fromPrivateKey(input)
    addAndMaybeSwitchToNewSigningKey(signingKey, input.alsoSwitchTo)
    return signingKey
  }
