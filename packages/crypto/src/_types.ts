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
