import { UInt256 } from '@radixdlt/uint256'

import { ResultAsync } from 'neverthrow'

export type Hasher = (inputData: Buffer) => Buffer

export type Signer = Readonly<{
	/**
	 * Produces a cryptographic signature of the input.
	 *
	 * @param {UnsignedMessage} unsignedMessage - The unsigned message to be hashed and signed.
	 * @returns {Signature} An EC signature produces by this signer when signing the message.
	 */
	sign: (
		unsignedMessage: UnsignedMessage,
	) => ResultAsync<Signature, Error>
}>

export type UnsignedMessage = Readonly<{
	unhashed: Buffer
	hasher: Hasher
}>

export type Signature = Readonly<{
	r: UInt256
	s: UInt256
}>

export type PublicKey = Readonly<{
	asData: (input: { readonly compressed: boolean }) => Buffer
	isValidSignature: (input: Readonly<{
		signature: Signature
		forData: UnsignedMessage
	}>) => boolean
}>

export type NoInputForDerivationSincePrivateKeyIsCurrentlyAccessible = Readonly<{
	derivationMethod: 'none'
}>

export type HierarchicalDeteriministicDerivationPath = Readonly<{
	derivationMethod: 'hdPath'
	toString: () => string
}>

export type PublicKeyDerivation =
	| HierarchicalDeteriministicDerivationPath
	| NoInputForDerivationSincePrivateKeyIsCurrentlyAccessible

export type PublicKeyProvider = Readonly<{
	derivePublicKey: (
		publicKeyDerivation?: PublicKeyDerivation,
	) => ResultAsync<PublicKey, Error>
}>
