import { AddressT } from '@radixdlt/account'
import { DSONCodable, JSONEncodable } from '@radixdlt/data-formats'
import { AmountT, Granularity, Nonce } from '@radixdlt/primitives'
import { Result } from 'neverthrow'
import { ResourceIdentifierT, TokenPermissions } from '../_types'
import { RadixParticleType } from './meta/radixParticleTypes'

export type ParticleBase = JSONEncodable &
	DSONCodable &
	Readonly<{
		equals: (other: ParticleBase) => boolean
	}>

export type RadixParticle = ParticleBase &
	Readonly<{
		radixParticleType: RadixParticleType
	}>

export type TokenBase = Readonly<{
	granularity: Granularity
	resourceIdentifier: ResourceIdentifierT
}>

export type TokenParticle = TokenBase &
	RadixParticle &
	Readonly<{
		permissions: TokenPermissions
		amount: AmountT
		nonce: Nonce
	}>

export type TransferrableTokensParticleT = RadixParticle &
	TokenParticle &
	TransferrableTokensParticleProps

export type TransferrableTokensParticleProps = Readonly<{
	address: AddressT
}>

export type UnallocatedTokensParticleT = RadixParticle & TokenParticle

export type ResourceIdentifierParticleT = RadixParticle &
	Readonly<{
		radixParticleType: RadixParticleType
		alwaysZeroNonce: Nonce
		resourceIdentifier: ResourceIdentifierT
	}>

export type TokenDefinitionBase = TokenBase &
	Readonly<{
		name: string
		description?: string
		url?: string
		iconURL?: string
	}>

export type TokenDefinitionParticleBase = TokenDefinitionBase & RadixParticle

export type FixedSupplyTokenDefinitionParticleT = TokenDefinitionParticleBase &
	Readonly<{
		fixedTokenSupply: AmountT
	}>

export type MutableSupplyTokenDefinitionParticleT = TokenDefinitionParticleBase &
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

export type AnySpunParticle = JSONEncodable &
	DSONCodable &
	SpunParticleBase &
	Readonly<{
		downedAsAny: () => Result<AnyDownParticle, Error>
		equals: (other: SpunParticleBase) => boolean
	}>

export type SpunParticleT<P extends ParticleBase> = AnySpunParticle &
	Readonly<{
		particle: P
		eraseToAny: () => AnySpunParticle
		downed: () => Result<DownParticle<P>, Error>
	}>

export type UpParticle<P extends ParticleBase> = SpunParticleT<P> &
	Readonly<{
		spin: Spin.UP
		toSpunParticle: () => SpunParticleT<P>
		eraseToAnyUp: () => AnyUpParticle
	}>

export type DownParticle<P extends ParticleBase> = SpunParticleT<P> &
	Readonly<{
		spin: Spin.DOWN
		particle: P
		toSpunParticle: () => SpunParticleT<P>
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
	) => SpunParticleT<TransferrableTokensParticleT>[]

	unallocatedTokensParticles: (
		spin?: Spin,
	) => SpunParticleT<UnallocatedTokensParticleT>[]

	tokenDefinitionParticleMatchingIdentifier: (
		resourceIdentifier: ResourceIdentifierT,
	) => TokenDefinitionParticleBase | undefined
}>

export type SpunParticles = SpunParticleQueryable &
	Readonly<{
		spunParticles: AnySpunParticle[]
	}>
