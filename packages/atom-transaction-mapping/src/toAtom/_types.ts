import { UserAction, UserActionType } from '@radixdlt/actions'
import { AnySpunParticle, AnyUpParticle, ParticleBase } from '@radixdlt/atom'
import { Result } from 'neverthrow'
import { AddressT } from '@radixdlt/account'
import { ParticleGroupT } from '@radixdlt/atom/src/_types'
import { AmountT } from '@radixdlt/primitives/src/_types'

export type FungibleParticleTransitioner<From extends ParticleBase> = Readonly<{
	transition: (
		input: Readonly<{
			currentParticles: From[]
			totalAmountToTransfer: AmountT
		}>,
	) => Result<AnySpunParticle[], Error>
}>

export type ActionToParticleGroupsMapper<
	T extends UserActionType = UserActionType
> = Readonly<{
	actionType: T
	particleGroupsFromAction: (
		input: Readonly<{
			action: UserAction<unknown>
			upParticles: AnyUpParticle[]
			addressOfActiveAccount: AddressT
		}>,
	) => Result<ParticleGroupT[], Error>
}>

export type MapperInput = Readonly<{
	action: UserAction<unknown>
	upParticles: AnyUpParticle[]
	addressOfActiveAccount: AddressT
}>

export type TokenTransferActionToParticleGroupsMapper = ActionToParticleGroupsMapper<UserActionType.TOKEN_TRANSFER>
export type BurnTokensActionToParticleGroupsMapper = ActionToParticleGroupsMapper<UserActionType.BURN_TOKENS>
