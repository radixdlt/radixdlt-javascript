import { UInt256 } from '@radixdlt/uint256'

import { ResultAsync } from 'neverthrow'

export type Hasher = (inputData: Buffer) => Buffer

export type Signer = {
	/**
	 * Produces a cryptographic signature of the input.
	 *
	 * @param {UnsignedMessage} unsignedMessage - The unsigned message to be hashed and signed.
	 * @returns {Signature} An EC signature produces by this signer when signing the message.
	 */
	readonly sign: (
		unsignedMessage: UnsignedMessage,
	) => ResultAsync<Signature, Error>
}

export type UnsignedMessage = {
	readonly unhashed: Buffer
	readonly hasher: Hasher
}

export type Signature = {
	readonly r: UInt256
	readonly s: UInt256
}

export type PublicKey = {
	readonly asData: (input: { readonly compressed: boolean }) => Buffer
	readonly isValidSignature: (input: {
		readonly signature: Signature
		readonly forData: UnsignedMessage
	}) => boolean
}

export type NoInputForDerivationSincePrivateKeyIsCurrentlyAccessible = {
	readonly derivationMethod: 'none'
}

export type HierarchicalDeteriministicDerivationPath = {
	readonly derivationMethod: 'hdPath'
	readonly toString: () => string
}

export type PublicKeyDerivation =
	| HierarchicalDeteriministicDerivationPath
	| NoInputForDerivationSincePrivateKeyIsCurrentlyAccessible

export type PublicKeyProvider = {
	readonly derivePublicKey: (
		publicKeyDerivation?: PublicKeyDerivation,
	) => ResultAsync<PublicKey, Error>
}
