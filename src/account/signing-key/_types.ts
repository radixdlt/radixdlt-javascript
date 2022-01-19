import {
  DiffieHellman,
  EncryptedMessageT,
  HDPathRadixT,
  PrivateKeyT,
  PublicKeyT,
  SignatureT,
} from '@crypto'
import { BuiltTransactionReadyToSign } from '@primitives'
import { ResultAsync } from 'neverthrow'
import { Observable } from 'rxjs'
import { Option } from 'prelude-ts'

export type PrivateKeyToSigningKeyInput = Readonly<{
  privateKey: PrivateKeyT
  name?: string
}>

export type AddSigningKeyByPrivateKeyInput = PrivateKeyToSigningKeyInput & {
  alsoSwitchTo?: boolean
}

export type Signing = {
  signHash: (hashedMessage: Buffer) => Observable<SignatureT>
  sign: (
    tx: BuiltTransactionReadyToSign,
    nonXrdHRP?: string,
  ) => ResultAsync<SignatureT, Error>
}

export type SigningKeyEncryptionInput = {
  plaintext: Buffer | string
  publicKeyOfOtherParty: PublicKeyT
}

export type Encrypting = {
  encrypt: (input: SigningKeyEncryptionInput) => Observable<EncryptedMessageT>
}

export type SigningKeyDecryptionInput = {
  encryptedMessage: Buffer | EncryptedMessageT
  publicKeyOfOtherParty: PublicKeyT
}

export type Decrypting = {
  decrypt: (input: SigningKeyDecryptionInput) => Observable<string>
}

export enum HDSigningKeyTypeIdentifier {
  LOCAL = 'LOCAL',
  HARDWARE_OR_REMOTE = 'HARDWARE_OR_REMOTE',
}

export enum SigningKeyTypeIdentifier {
  HD_SIGNING_KEY = 'HD_SIGNING_KEY',
  NON_HD_SIGNING_KEY = 'NON_HD_SIGNING_KEY',
}

export type BaseSigningKeyTypeT<T extends SigningKeyTypeIdentifier> = {
  typeIdentifier: T
  isHDSigningKey: boolean
  isHardwareSigningKey: boolean
  uniqueKey: string
}

export type SigningKeyTypeHDT =
  BaseSigningKeyTypeT<SigningKeyTypeIdentifier.HD_SIGNING_KEY> & {
    hdSigningKeyType: HDSigningKeyTypeIdentifier
    hdPath: HDPathRadixT
  }

export type SigningKeyTypeNonHDT =
  BaseSigningKeyTypeT<SigningKeyTypeIdentifier.NON_HD_SIGNING_KEY> & {
    name?: string
  }

export type SigningKeyTypeT = SigningKeyTypeHDT | SigningKeyTypeNonHDT

export type SigningKeyT = Signing &
  Encrypting &
  Decrypting & {
    // useful for testing.
    __diffieHellman: DiffieHellman

    // Type of signingKey: `SigningKeyTypeHDT` or `SigningKeyTypeNonHDT`, where HD has `hdSigningKeyType` which can be `LOCAL` or `HARDWARE_OR_REMOTE` (e.g. Ledger Nano)
    type: SigningKeyTypeT
    publicKey: PublicKeyT

    // Only relevant for Hardware accounts. Like property `publicKey` but a function and omits BIP32 path on HW display
    // For NON-Hardware accounts this will just return the cached `publicKey` property.
    getPublicKeyDisplayOnlyAddress: () => Observable<PublicKeyT>

    // sugar for `type.uniqueKey`
    uniqueIdentifier: string

    // Useful for debugging.
    toString: () => string

    // Sugar for thisSigningKey.publicKey.equals(other.publicKey)
    equals: (other: SigningKeyT) => boolean

    // Sugar for `type.hdPath`, iff, type.typeIdentifier === SigningKeyTypeHDT
    hdPath?: HDPathRadixT

    // Sugar for `type.isHDSigningKey`
    isHDSigningKey: boolean
    // Sugar for `type.isHardwareSigningKey`
    isHardwareSigningKey: boolean
    // Sugar for `isHDSigningKey && !isHardwareSigningKey`
    isLocalHDSigningKey: boolean
  }

export type SigningKeysT = Readonly<{
  toString: () => string
  equals: (other: SigningKeysT) => boolean

  // Get only HD signingKey, by its path
  getHDSigningKeyByHDPath: (hdPath: HDPathRadixT) => Option<SigningKeyT>
  // Get any signingKey by its public key
  getAnySigningKeyByPublicKey: (publicKey: PublicKeyT) => Option<SigningKeyT>

  all: SigningKeyT[]

  hdSigningKeys: () => SigningKeyT[]
  localHDSigningKeys: () => SigningKeyT[]
  hardwareHDSigningKeys: () => SigningKeyT[]
  nonHDSigningKeys: () => SigningKeyT[]

  // size of `all.
  size: () => number
}>
