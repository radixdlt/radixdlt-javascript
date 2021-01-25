import { Address } from '@radixdlt/crypto'
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
	}>

export type TransferrableTokensParticle = /* DSONCoable */ RadixParticle &
	Readonly<{
		radixParticleType: RadixParticleType
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
		radixParticleType: RadixParticleType
		tokenDefinitionReference: ResourceIdentifier
		granularity: Granularity
		nonce: Nonce
		amount: Supply
		permissions: TokenPermissions
	}>

export type ResourceIdentifierParticle = /* DSONCodable */ RadixParticle &
	Readonly<{
		radixParticleType: RadixParticleType
		alwaysZeroNonce: Nonce
		resourceIdentifier: ResourceIdentifier
	}>

export enum Spin {
	/* The implicit and theoretical state `NEUTRAL` for spin is not relevant from a client library perspective, thus omitted.*/
	UP = 1,
	DOWN = -1,
}

export type SpunParticleBase = Readonly<{
	spin: Spin
	particle: ParticleBase
}>

export type AnySpunParticle = SpunParticleBase &
	Readonly<{
		downedAsAny: () => Result<AnyDownParticle, Error>
		equals: (other: SpunParticleBase) => boolean
	}>

export type SpunParticle<
	P extends ParticleBase
> = /* DSONCodable & */ AnySpunParticle &
	Readonly<{
		particle: P
		eraseToAny: () => AnySpunParticle
		downed: () => Result<DownParticle<P>, Error>
	}>

export type UpParticle<P extends ParticleBase> = SpunParticle<P> &
	Readonly<{
		spin: Spin.UP
		toSpunParticle: () => SpunParticle<P>
		eraseToAny: () => AnyUpParticle
	}>

export type DownParticle<P extends ParticleBase> = SpunParticle<P> &
	Readonly<{
		spin: Spin.DOWN
		particle: P
		toSpunParticle: () => SpunParticle<P>
		eraseToAny: () => AnyDownParticle
	}>

export type AnyUpParticle = AnySpunParticle &
	Readonly<{
		spin: Spin.UP
		toAnySpunParticle: () => AnySpunParticle
	}>

export type AnyDownParticle = AnySpunParticle &
	Readonly<{
		spin: Spin.DOWN
		toAnySpunParticle: () => AnySpunParticle
	}>

export type SpunParticles = Readonly<{
	spunParticles: SpunParticleBase[]

	anySpunParticlesOfTypeWithSpin: (query: {
		particleTypes?: RadixParticleType[]
		spin?: Spin
	}) => AnySpunParticle[]

	transferrableTokensParticles: (
		spin?: Spin,
	) => SpunParticle<TransferrableTokensParticle>[]

	unallocatedTokensParticles: (
		spin?: Spin,
	) => SpunParticle<UnallocatedTokensParticle>[]
}>

export type Particle = {
	equals: (other: any) => boolean
	nonce: Nonce
	tokenDefinitionReference: ResourceIdentifier
}

export type TokenParticle = Particle & {
	granularity: Granularity
	amount: Supply
	permissions: TokenPermissions
}

/*

export type TransferrableTokensParticle =  TokenParticle &
	Readonly<{
		address: Address
	}>

export type UnallocatedTokensParticle =  TokenParticle &
	Readonly<{
	}>

export type ResourceIdentifierParticle =  Particle &
	Readonly<{
	}>

export enum Spin {

	UP = 1,
	DOWN = -1,
}

export type SpunParticle = Particle & Readonly<{
	spin: Spin,
}>
*/
