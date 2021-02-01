import { Address } from '@radixdlt/crypto'
import { DSONCodable } from '@radixdlt/dson'
import { Granularity, Nonce, PositiveAmount } from '@radixdlt/primitives'
import { Result } from 'neverthrow'
import { ResourceIdentifier, Supply, TokenPermissions } from '../_types'
import { RadixParticleType } from './meta/radixParticleTypes'

export type ParticleBase = {
	equals: (other: ParticleBase) => boolean
}

export type RadixParticle = ParticleBase &
	Readonly<{
		radixParticleType: RadixParticleType
	}>

export type TransferrableTokensParticle = DSONCodable &
	RadixParticle &
	TokenParticle &
	TransferrableTokensParticleProps

export type TransferrableTokensParticleProps = Readonly<{
	address: Address
	amount: PositiveAmount
}>

export type UnallocatedTokensParticle = DSONCodable &
	RadixParticle &
	TokenParticle &
	UnallocatedTokensParticleProps

export type UnallocatedTokensParticleProps = Readonly<{
	amount: Supply
}>

export type ResourceIdentifierParticle = DSONCodable &
	RadixParticle &
	Readonly<{
		radixParticleType: RadixParticleType
		alwaysZeroNonce: Nonce
		resourceIdentifier: ResourceIdentifier
	}>

export type TokenDefinitionParticleBase = /* DSONCodable */ RadixParticle &
	Readonly<{
		name: string
		description?: string
		resourceIdentifier: ResourceIdentifier
		granularity: Granularity
		url?: URL
		iconURL?: URL
	}>

export type FixedSupplyTokenDefinitionParticle = TokenDefinitionParticleBase &
	Readonly<{
		fixedTokenSupply: Supply
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
	spunParticles: AnySpunParticle[]

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

export type TokenParticle = RadixParticle &
	Readonly<{
		granularity: Granularity
		permissions: TokenPermissions
		tokenDefinitionReference: ResourceIdentifier
		nonce: Nonce
	}>
