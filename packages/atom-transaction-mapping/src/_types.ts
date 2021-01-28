import { UserAction, UserActionType } from '@radixdlt/actions'
import { AnyUpParticle, ParticleBase, SpunParticles } from '@radixdlt/atom'
import { Address } from '@radixdlt/crypto'
import { Result } from 'neverthrow'
import { Amount, PositiveAmount } from "@radixdlt/primitives";

export type FungibleParticleTransition<
	From extends ParticleBase,
	To extends ParticleBase
> = Readonly<{
	removed: From[]
	migrated: From[]
	transitioned: To[]
}>

export type FungibleParticleTransitioner<
	From extends ParticleBase,
	To extends ParticleBase
> = Readonly<{
	transition: (
		input: Readonly<{
			unconsumedFungibles: From[]
			toAmount: Amount
		}>,
	) => Result<FungibleParticleTransition<From, To>, Error>
}>

export type ActionToParticleGroupsMapper = Readonly<{
	actionType: UserActionType
	particleGroupsFromAction: (
		input: Readonly<{
			action: UserAction
			upParticles: AnyUpParticle[]
			addressOfActiveAccount: Address
		}>,
	) => Result<SpunParticles, Error>
}>

export type TokenTransferActionToParticleGroupsMapper = ActionToParticleGroupsMapper &
	Readonly<{
		actionType: UserActionType.TOKEN_TRANSFER
	}>
