import { Address } from '@radixdlt/crypto'
import {
	Amount,
	Granularity,
	Nonce,
	PositiveAmount,
} from '@radixdlt/primitives'
import { Result } from 'neverthrow'

/**
 * A Radix resource identifier is a human readable index into the Ledger which points to a name state machine
 *
 * On format: `/:address/:name`, e.g.
 * `"/JH1P8f3znbyrDj8F4RWpix7hRkgxqHjdW2fNnKpR3v6ufXnknor/XRD"`
 */
export type ResourceIdentifier = /* DSONCoable */ Readonly<{
	address: Address
	name: string
	toString: () => string
	equals: (other: ResourceIdentifier) => boolean
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

export type Supply = Amount

export type TokenPermissions = /* DSONCodable */ Readonly<{
	canBeMinted: (isOwnerOfToken: IsOwnerOfToken) => boolean
	canBeBurned: (isOwnerOfToken: IsOwnerOfToken) => boolean
}>

export type ParticleType = {
	particleType: string
}

export type TransferrableTokensParticle = /* DSONCoable */ ParticleType &
	Readonly<{
		// The recipient address of the tokens to be transffered
		address: Address
		// The identifier of which token type is being transferred
		tokenDefinitionReference: ResourceIdentifier
		granularity: Granularity
		nonce: Nonce
		amount: PositiveAmount
		permissions: TokenPermissions
	}>

export type UnallocatedTokensParticle = /* DSONCoable */ ParticleType &
	Readonly<{
		tokenDefinitionReference: ResourceIdentifier
		granularity: Granularity
		nonce: Nonce
		amount: Supply
		permissions: TokenPermissions
	}>

export type ResourceIdentifierParticle = /* DSONCodable */ ParticleType &
	Readonly<{
		alwaysZeroNonce: Nonce
		resourceIdentifier: ResourceIdentifier
	}>

export enum Spin {
	/* The implicit and theoretical state `NEUTRAL` for spin is not relevant from a client library perspective, thus omitted.*/
	UP = 1,
	DOWN = -1,
}

export type SpunParticleLike = Readonly<{
	spin: Spin
	particle: ParticleType
}>

export type AnySpunParticle = SpunParticleLike &
	Readonly<{
		downed: () => Result<AnyDownParticle, Error>
	}>

export type SpunParticle<
	Particle extends ParticleType
> = /* DSONCodable & */ SpunParticleLike &
	Readonly<{
		particle: Particle
		eraseToAny: () => SpunParticleLike
		downed: () => Result<DownParticle<Particle>, Error>
	}>

export type UpParticle<Particle extends ParticleType> = SpunParticleLike &
	Readonly<{
		spin: Spin.UP
		particle: Particle
		eraseToAny: () => AnyUpParticle
	}>

export type DownParticle<Particle extends ParticleType> = SpunParticleLike &
	Readonly<{
		spin: Spin.DOWN
		particle: Particle
		eraseToAny: () => AnyDownParticle
	}>

export type AnyUpParticle = SpunParticleLike &
	Readonly<{
		spin: Spin.UP
	}>

export type AnyDownParticle = SpunParticleLike &
	Readonly<{
		spin: Spin.DOWN
	}>
