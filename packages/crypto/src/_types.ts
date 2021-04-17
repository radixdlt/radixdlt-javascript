import { UInt256 } from '@radixdlt/uint256'

import { ResultAsync } from 'neverthrow'
export type Hasher = (input: Buffer | string) => Buffer

export type DiffieHellman = (
	publicKeyOfOtherParty: PublicKey,
) => ResultAsync<ECPointOnCurve, Error>

export type Signer = Readonly<{
	sign: (hashedMessage: Buffer) => ResultAsync<Signature, Error>

	signUnhashed: (
		input: Readonly<{
			msgToHash: Buffer | string
			hasher?: Hasher
		}>,
	) => ResultAsync<Signature, Error>
}>

export type Signature = Readonly<{
	r: UInt256
	s: UInt256
	toDER: () => string
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

export const publicKeyCompressedByteCount = 33

export type PublicKey = Readonly<{
	__hex: string // debug print
	asData: (input: { readonly compressed: boolean }) => Buffer
	toString: (compressed?: boolean) => string
	isValidSignature: (
		input: Readonly<{
			signature: Signature
			hashedMessage: Buffer
		}>,
	) => boolean
	decodeToPointOnCurve: () => ECPointOnCurve
	equals: (other: PublicKey) => boolean
}>

export type PrivateKey = Signer &
	Readonly<{
		diffieHellman: DiffieHellman
		scalar: UInt256
		publicKey: () => PublicKey
		toString: () => string
	}>

export type KeyPair = Readonly<{
	publicKey: PublicKey
	privateKey: PrivateKey
}>
