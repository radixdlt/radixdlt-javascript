import {
  byEncryptingMnemonicAndSavingKeystore,
  byLoadingAndDecryptingKeystore,
  fromKeystore,
} from './keystore'
import { createSigningKeychain } from './create-signing-keychain/createSigningKeychain'

export const SigningKeychain = {
  create: createSigningKeychain,
  fromKeystore,
  byLoadingAndDecryptingKeystore,
  byEncryptingMnemonicAndSavingKeystore,
}
