import { Address, Signature } from '@radixdlt/crypto'
import {
	Amount,
	Granularity,
	Nonce,
	PositiveAmount,
} from '@radixdlt/primitives'
import { Result } from 'neverthrow'
import { RadixParticleType } from './radixParticleTypes'

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

/**
 * An Atom Identifier, made up of 256 bits of a hash.
 * The Atom ID is used so that Atoms can be located using just their hash id.
 */
export type AtomIdentifier = /* DSONCoable */ Readonly<{
	toString: () => string
	equals: (other: AtomIdentifier) => boolean
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
	permissions: ReadonlyMap<TokenTransition, TokenPermission>
	canBeMinted: (isOwnerOfToken: IsOwnerOfToken) => boolean
	canBeBurned: (isOwnerOfToken: IsOwnerOfToken) => boolean
	equals: (other: TokenPermissions) => boolean
}>

export type ParticleBase = {
	equals: (other: ParticleBase) => boolean
}

export type RadixParticle = ParticleBase &
	Readonly<{
		radixParticleType: RadixParticleType
		hasAllegedType: (
			allegedThis: RadixParticle,
		) => ThisType<RadixParticle> | undefined
	}>

export type TransferrableTokensParticle = /* DSONCoable */ RadixParticle &
	Readonly<{
		radixParticleType: RadixParticleType.TRANSFERRABLE_TOKENS
		// The recipient address of the tokens to be transffered
		address: Address
		// The identifier of which token type is being transferred
		tokenDefinitionReference: ResourceIdentifier
		granularity: Granularity
		nonce: Nonce
		amount: PositiveAmount
		permissions: TokenPermissions
	}>

export type UnallocatedTokensParticle = /* DSONCoable */ RadixParticle &
	Readonly<{
		radixParticleType: RadixParticleType.UNALLOCATED_TOKENS
		tokenDefinitionReference: ResourceIdentifier
		granularity: Granularity
		nonce: Nonce
		amount: Supply
		permissions: TokenPermissions
	}>

export type ResourceIdentifierParticle = /* DSONCodable */ RadixParticle &
	Readonly<{
		radixParticleType: RadixParticleType.RESOURCE_IDENTIFIER
		alwaysZeroNonce: Nonce
		resourceIdentifier: ResourceIdentifier
	}>

export enum Spin {
	/* The implicit and theoretical state `NEUTRAL` for spin is not relevant from a client library perspective, thus omitted.*/
	UP = 'Up', //1,
	DOWN = 'Down', // -1,
}

export type SpunParticleLike = Readonly<{
	spin: Spin
	particle: ParticleBase
	equals: (other: SpunParticleLike) => boolean
}>

export type AnySpunParticle = SpunParticleLike &
	Readonly<{
		downed: () => Result<AnyDownParticle, Error>
	}>

export type SpunParticle<
	Particle extends ParticleBase
> = /* DSONCodable & */ SpunParticleLike &
	Readonly<{
		particle: Particle
		eraseToAny: () => SpunParticleLike
		downed: () => Result<DownParticle<Particle>, Error>
	}>

export type UpParticle<Particle extends ParticleBase> = SpunParticleLike &
	Readonly<{
		spin: Spin.UP
		particle: Particle
		eraseToAny: () => AnyUpParticle
	}>

export type DownParticle<Particle extends ParticleBase> = SpunParticleLike &
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

export type SignatureID = string
export type Signatures = ReadonlyMap<SignatureID, Signature>

export type SpunParticles = Readonly<{
	spunParticles: SpunParticleLike[]

	anySpunParticlesOfTypeWithSpin: (query: {
		particleTypes?: RadixParticleType[]
		spin?: Spin
	}) => AnySpunParticle[]

	spunParticlesOfTypeWithSpin: <Particle extends RadixParticle>(query: {
		spin?: Spin
	}) => SpunParticle<Particle>[]

	// upParticlesOfType: <Particle extends ParticleBase>(
	// 	allowedVehicleTypes?: InstanceType<typeof VehicleType>[]
	// ) => UpParticle<Particle>[]

	// downParticlesOfType: <Particle extends ParticleBase>(
	// 	allowedVehicleTypes?: InstanceType<typeof VehicleType>[]
	// ) => DownParticle<Particle>[]
}>

export type Message = string

export type Atom = /* DSONCodable & */ Readonly<{
	particles: SpunParticles
	signatures?: Signatures
	message?: Message
	identifier: AtomIdentifier
}>
