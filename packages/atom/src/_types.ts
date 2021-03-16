import { Signature } from '@radixdlt/crypto'
import { AddressT } from '@radixdlt/account'
import { DSONCodable, JSONEncodable } from '@radixdlt/data-formats'
import { SpunParticleQueryable, SpunParticles } from './particles/_types'

/**
 * A Radix resource identifier is a human readable index into the Ledger which points to a name state machine
 *
 * On format: `/:address/:name`, e.g.
 * `"/JH1P8f3znbyrDj8F4RWpix7hRkgxqHjdW2fNnKpR3v6ufXnknor/XRD"`
 */
export type ResourceIdentifierT = JSONEncodable &
	DSONCodable &
	Readonly<{
		address: AddressT
		name: string
		toString: () => string
		equals: (other: ResourceIdentifierT) => boolean
	}>

/**
 * An Atom Identifier, made up of 256 bits of a hash.
 * The Atom ID is used so that Atoms can be located using just their hash id.
 */
export type AtomIdentifierT = DSONCodable &
	Readonly<{
		toString: () => string
		equals: (other: AtomIdentifierT) => boolean
	}>

export type IsOwnerOfToken = () => boolean

export enum TokenPermission {
	TOKEN_OWNER_ONLY = 'token_owner_only',
	ALL = 'all',
	NONE = 'none',
}

export enum TokenTransition {
	MINT = 'mint',
	BURN = 'burn',
}

export const SERIALIZER_KEY = 'serializer'

export type TokenPermissions = JSONEncodable &
	DSONCodable &
	Readonly<{
		permissions: Readonly<{ [key in TokenTransition]: TokenPermission }>
		canBeMinted: (isOwnerOfToken: IsOwnerOfToken) => boolean
		canBeBurned: (isOwnerOfToken: IsOwnerOfToken) => boolean
		mintPermission: TokenPermission
		equals: (other: TokenPermissions) => boolean
	}>

export type ParticleGroupT = JSONEncodable &
	DSONCodable &
	SpunParticleQueryable &
	Readonly<{
		spunParticles: SpunParticles
	}>

export type ParticleGroups = DSONCodable &
	SpunParticleQueryable &
	Readonly<{
		groups: ParticleGroupT[]
	}>

// TODO change this when we have DSON encoding in place. Should be hash of dson truncated.
export type PublicKeyID = string

export type SignatureID = PublicKeyID
export type Signatures = Readonly<{ [key in SignatureID]: Signature }>

export type AtomT = JSONEncodable &
	DSONCodable &
	SpunParticleQueryable &
	Readonly<{
		particleGroups: ParticleGroups // can be empty
		signatures: Signatures // can be empty
		message?: string
		equals: (other: AtomT) => boolean
		identifier: () => AtomIdentifierT
		isSigned: () => boolean
	}>
