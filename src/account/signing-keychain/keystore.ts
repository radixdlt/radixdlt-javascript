import { ByLoadingAndDecryptingKeystoreInput, SigningKeychainT } from './_types'
import { log, msgFromError } from '@util'
import { ResultAsync } from 'neverthrow'
import { createSigningKeychain } from './create-signing-keychain/createSigningKeychain'
import { FromKeystoreInput } from './_types'
import { Keystore, KeystoreT, Mnemonic } from '@crypto'
import { ByEncryptingMnemonicAndSavingKeystoreInput } from './_types'

export const fromKeystore = (
  input: FromKeystoreInput,
): ResultAsync<SigningKeychainT, Error> =>
  Keystore.decrypt(input)
    .map(entropy => ({ entropy }))
    .andThen(Mnemonic.fromEntropy)
    .map(mnemonic => ({
      mnemonic,
      startWithInitialSigningKey: input.startWithInitialSigningKey,
    }))
    .map(createSigningKeychain)

export const byEncryptingMnemonicAndSavingKeystore = (
  input: ByEncryptingMnemonicAndSavingKeystoreInput,
): ResultAsync<SigningKeychainT, Error> => {
  const { mnemonic, password, startWithInitialSigningKey } = input

  const save = (keystoreToSave: KeystoreT): ResultAsync<KeystoreT, Error> =>
    ResultAsync.fromPromise(input.save(keystoreToSave), (e: unknown) => {
      const underlyingError = msgFromError(e)
      const errMsg = `Failed to save keystore, underlying error: '${underlyingError}'`
      log.error(errMsg)
      return new Error(errMsg)
    }).map(() => {
      log.info('Keystore successfully saved.')
      return keystoreToSave
    })

  return Keystore.encryptSecret({
    secret: mnemonic.entropy,
    password,
  })
    .andThen(save)
    .map((keystore: KeystoreT) => ({
      keystore,
      password,
      startWithInitialSigningKey,
    }))
    .andThen(fromKeystore)
}

export const byLoadingAndDecryptingKeystore = (
  input: ByLoadingAndDecryptingKeystoreInput,
): ResultAsync<SigningKeychainT, Error> => {
  const loadKeystore = (): ResultAsync<KeystoreT, Error> =>
    ResultAsync.fromPromise(input.load(), (e: unknown) => {
      const underlyingError = msgFromError(e)
      const errMsg = `Failed to load keystore, underlying error: '${underlyingError}'`
      log.error(errMsg)
      return new Error(errMsg)
    })
  return loadKeystore()
    .map((keystore: KeystoreT) => {
      log.info('Keystore successfully loaded.')
      return { ...input, keystore }
    })
    .andThen(fromKeystore)
}
