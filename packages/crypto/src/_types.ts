import { DSONCodable, JSONEncodable } from '@radixdlt/data-formats'
import { Byte } from '@radixdlt/util'
import { UInt256 } from '@radixdlt/uint256'

import { Result, ResultAsync } from 'neverthrow'

export type Hasher = (inputData: Buffer) => Buffer

export type Signer = Readonly<{
	/**
	 * Produces a cryptographic signature of the input.
	 *
	 * @param {UnsignedMessage} unsignedMessage - The unsigned message to be hashed and signed.
	 * @returns {Signature} An EC signature produces by this signer when signing the message.
	 */
	sign: (unsignedMessage: UnsignedMessage) => ResultAsync<Signature, Error>
}>

export type UnsignedMessage = Readonly<{
	unhashed: Buffer
	hasher: Hasher
}>

export type Signature = Readonly<{
	r: UInt256
	s: UInt256
	equals: (other: Signature) => boolean
}>

// A non-infinity point on the EC curve (e.g. `secp256k1`)
export type ECPointOnCurve = Readonly<{
	x: UInt256
	y: UInt256
	equals: (other: ECPointOnCurve) => boolean
	add: (other: ECPointOnCurve) => ECPointOnCurve
	multiply: (by: UInt256) => ECPointOnCurve
}>

export type PublicKey = Readonly<{
	asData: (input: { readonly compressed: boolean }) => Buffer
	isValidSignature: (
		input: Readonly<{
			signature: Signature
			forData: UnsignedMessage
		}>,
	) => boolean
	decodeToPointOnCurve: () => ECPointOnCurve
	equals: (other: PublicKey) => boolean
}>

export type PublicKeyProvider = Readonly<{
	derivePublicKey: () => ResultAsync<PublicKey, Error>
}>

export type PrivateKey = Signer &
	PublicKeyProvider & {
		scalar: UInt256,
		toString: () => string
	}

export type KeyPair = Readonly<{
	publicKey: PublicKey,
	privateKey: PrivateKey
}>

export type Address = JSONEncodable &
	DSONCodable &
	Readonly<{
		publicKey: PublicKey
		magicByte: Byte
		toString: () => string
		equals: (other: Address) => boolean
	}>
