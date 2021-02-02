import { BurnTokensAction, UserAction, UserActionType } from '@radixdlt/actions'
import {
	AnyUpParticle,
	isMutableTokenDefinitionParticle,
	particleGroup,
	ParticleGroup,
	spunParticles,
	TokenDefinitionParticleBase,
	TransferrableTokensParticle,
	unallocatedTokensParticle,
	UnallocatedTokensParticle,
	UpParticle,
} from '@radixdlt/atom'
import { Address } from '@radixdlt/crypto'
import { err, Result, ok } from 'neverthrow'
import { BurnTokensActionToParticleGroupsMapper } from './_types'
import {
	transferrableTokensParticleFromParticle,
	validateInputCollectUpParticles,
} from './tokenTransferActionToParticleGroupsMapper'
import { makeTransitioner } from './fungibleParticleTransitioner'
import { Amount, positiveAmount } from '@radixdlt/primitives'

export const unallocatedTokensParticleFromTransferrable = (
	input: Readonly<{
		transferrableTokensParticle: TransferrableTokensParticle
		amount: Amount
	}>,
): UnallocatedTokensParticle => {
	const positiveAmt = positiveAmount(input.amount)._unsafeUnwrap()
	return unallocatedTokensParticle({
		...input.transferrableTokensParticle,
		amount: positiveAmt,
	})
}

const particleGroupsFromBurnTokensAction = (
	input: Readonly<{
		burnTokensAction: BurnTokensAction
		upParticles: UpParticle<TransferrableTokensParticle>[]
		addressOfActiveAccount: Address
	}>,
): Result<ParticleGroup[], Error> => {
	const burnAction = input.burnTokensAction

	const transitioner = makeTransitioner<
		TransferrableTokensParticle,
		UnallocatedTokensParticle
	>({
		inputAmountMapper: (from: TransferrableTokensParticle) => from.amount,
		inputCreator: (
			amount: Amount,
			from: TransferrableTokensParticle,
		): TransferrableTokensParticle =>
			transferrableTokensParticleFromParticle({
				amount,
				from,
				address: burnAction.sender,
			}),
		outputCreator: (
			_,
			from: TransferrableTokensParticle,
		): UnallocatedTokensParticle =>
			unallocatedTokensParticleFromTransferrable({
				amount: burnAction.amount,
				transferrableTokensParticle: from,
			}),
	})

	const consumableParticles = input.upParticles
		.map((sp) => sp.particle)
		.filter((p) =>
			p.tokenDefinitionReference.equals(
				burnAction.tokenResourceIdentifier,
			),
		)

	return transitioner
		.transition({
			currentParticles: consumableParticles,
			totalAmountToTransfer: burnAction.amount,
		})
		.map((spp) => spunParticles(spp))
		.map((sps) => [particleGroup(sps)])
}

export const burnTokensActionToParticleGroupsMapper = (): BurnTokensActionToParticleGroupsMapper => {
	const actionType = UserActionType.BURN_TOKENS
	return {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
		actionType,
		particleGroupsFromAction: (
			input: Readonly<{
				action: UserAction
				upParticles: AnyUpParticle[]
				addressOfActiveAccount: Address
			}>,
		): Result<ParticleGroup[], Error> => {
			return validateInputCollectUpParticles({
				...input,
				typeOfThisMapper: actionType,
				validateTokenDefinition: (
					tokenDefinitionParticle: TokenDefinitionParticleBase,
				): Result<true, Error> => {
					const burner = input.action.sender
					if (
						!isMutableTokenDefinitionParticle(
							tokenDefinitionParticle,
						)
					) {
						return err(
							new Error(
								`Can only burn tokens with mutable supply.`,
							),
						)
					}
					const mutableToken = tokenDefinitionParticle
					const isTokenOwner = (): boolean =>
						mutableToken.resourceIdentifier.address.equals(burner)
					if (!mutableToken.permissions.canBeBurned(isTokenOwner)) {
						return err(new Error(`Not permission to burn token.`))
					}
					return ok(true)
				},
			}).andThen((upParticles) =>
				particleGroupsFromBurnTokensAction({
					burnTokensAction: input.action as BurnTokensAction,
					upParticles: upParticles,
					addressOfActiveAccount: input.addressOfActiveAccount,
				}),
			)
		},
	}
}
