import { Address } from '@radixdlt/account'
import { DSONCodable } from '@radixdlt/data-formats'
import { Amount, Granularity, Nonce } from '@radixdlt/primitives'
import { Result } from 'neverthrow'
import { ResourceIdentifier, TokenPermissions } from '../_types'
import { RadixParticleType } from './meta/radixParticleTypes'

export type ParticleBase = DSONCodable & Readonly<{
	equals: (other: ParticleBase) => boolean
}>

export type RadixParticle = ParticleBase &
	Readonly<{
		radixParticleType: RadixParticleType
	}>

export type TokenBase = Readonly<{
	granularity: Granularity
	resourceIdentifier: ResourceIdentifier
}>

export type TokenParticle = TokenBase &
	RadixParticle &
	Readonly<{
		permissions: TokenPermissions
		amount: Amount
		nonce: Nonce
	}>

export type TransferrableTokensParticle = RadixParticle &
	TokenParticle &
	TransferrableTokensParticleProps

export type TransferrableTokensParticleProps = Readonly<{
	address: Address
}>

export type UnallocatedTokensParticle = RadixParticle & TokenParticle

export type ResourceIdentifierParticle = RadixParticle &
	Readonly<{
		radixParticleType: RadixParticleType
		alwaysZeroNonce: Nonce
		resourceIdentifier: ResourceIdentifier
	}>

export type TokenDefinitionBase = TokenBase &
	Readonly<{
		name: string
		description?: string
		url?: string
		iconURL?: string
	}>

export type TokenDefinitionParticleBase = TokenDefinitionBase & RadixParticle

export type FixedSupplyTokenDefinitionParticle = TokenDefinitionParticleBase &
	Readonly<{
		fixedTokenSupply: Amount
	}>

export type MutableSupplyTokenDefinitionParticle = TokenDefinitionParticleBase &
	Readonly<{
		permissions: TokenPermissions
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

export type AnySpunParticle = DSONCodable &
	SpunParticleBase &
	Readonly<{
		downedAsAny: () => Result<AnyDownParticle, Error>
		equals: (other: SpunParticleBase) => boolean
	}>

export type SpunParticle<P extends ParticleBase> = AnySpunParticle &
	Readonly<{
		particle: P
		eraseToAny: () => AnySpunParticle
		downed: () => Result<DownParticle<P>, Error>
	}>

export type UpParticle<P extends ParticleBase> = SpunParticle<P> &
	Readonly<{
		spin: Spin.UP
		toSpunParticle: () => SpunParticle<P>
		eraseToAnyUp: () => AnyUpParticle
	}>

export type DownParticle<P extends ParticleBase> = SpunParticle<P> &
	Readonly<{
		spin: Spin.DOWN
		particle: P
		toSpunParticle: () => SpunParticle<P>
		eraseToAnyDown: () => AnyDownParticle
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

export type SpunParticleQueryable = Readonly<{
	anySpunParticlesOfTypeWithSpin: (query: {
		particleTypes?: RadixParticleType[]
		spin?: Spin
	}) => AnySpunParticle[]

	upParticles: () => AnyUpParticle[]

	transferrableTokensParticles: (
		spin?: Spin,
	) => SpunParticle<TransferrableTokensParticle>[]

	unallocatedTokensParticles: (
		spin?: Spin,
	) => SpunParticle<UnallocatedTokensParticle>[]

	tokenDefinitionParticleMatchingIdentifier: (
		resourceIdentifier: ResourceIdentifier,
	) => TokenDefinitionParticleBase | undefined
}>

export type SpunParticles = SpunParticleQueryable &
	Readonly<{
		spunParticles: AnySpunParticle[]
	}>
