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
	toBuffer: () => Buffer
	equals: (other: ECPointOnCurve) => boolean
	add: (other: ECPointOnCurve) => ECPointOnCurve
	multiply: (by: UInt256) => ECPointOnCurve
	multiplyWithPrivateKey: (privateKey: PrivateKey) => ECPointOnCurve
}>

export type PublicKey = Readonly<{
	asData: (input: { readonly compressed: boolean }) => Buffer
	toString: (compressed?: boolean) => string
	isValidSignature: (
		input: Readonly<{
			signature: Signature
			forData: UnsignedMessage
		}>,
	) => boolean
	decodeToPointOnCurve: () => ECPointOnCurve
	equals: (other: PublicKey) => boolean
}>

export type PrivateKey = Signer &
	Readonly<{
		scalar: UInt256
		publicKey: () => PublicKey
		toString: () => string
	}>

export type KeyPair = Readonly<{
	publicKey: PublicKey
	privateKey: PrivateKey
}>
