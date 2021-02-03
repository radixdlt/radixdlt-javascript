import { BurnTokensAction, UserActionType } from '@radixdlt/actions'
import {
	isMutableTokenDefinitionParticle,
	particleGroup,
	ParticleGroup,
	spunParticles,
	TokenDefinitionParticleBase,
	transferrableTokensParticle,
	TransferrableTokensParticle,
	unallocatedTokensParticle,
	UnallocatedTokensParticle,
	UpParticle,
} from '@radixdlt/atom'
import { Address } from '@radixdlt/crypto'
import { err, Result, ok, combine } from 'neverthrow'
import { BurnTokensActionToParticleGroupsMapper, MapperInput } from './_types'
import { makeTransitioner } from './fungibleParticleTransitioner'
import { Amount } from '@radixdlt/primitives'
import {
	validate,
	validateConsumeTokensAction,
	validateUserActionSender,
	validateUserActionType,
} from './validation'
import { collectUpParticles } from './utils'

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
		inputCreator: (amount: Amount, from: TransferrableTokensParticle) =>
			transferrableTokensParticle({
				...from,
				amount,
				address: burnAction.sender,
			}),
		outputCreator: (_, from: TransferrableTokensParticle) =>
			ok(
				unallocatedTokensParticle({
					...from,
					amount: burnAction.amount,
				}),
			),
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

export type ValidationWitness = Readonly<{ witness: string }>
const tokenDefinitionValidation = (input: {
	tokenDefinitionParticle: TokenDefinitionParticleBase
	burner: Address
}): Result<ValidationWitness, Error> => {
	if (!isMutableTokenDefinitionParticle(input.tokenDefinitionParticle)) {
		return err(new Error(`Can only burn tokens with mutable supply.`))
	}
	const mutableToken = input.tokenDefinitionParticle
	const isTokenOwner = (): boolean =>
		mutableToken.resourceIdentifier.address.equals(input.burner)
	if (!mutableToken.permissions.canBeBurned(isTokenOwner)) {
		return err(new Error(`Not permission to burn token.`))
	}
	return ok(<ValidationWitness>{ witness: 'Has permission to burn' })
}

export const burnTokensActionToParticleGroupsMapper = (): BurnTokensActionToParticleGroupsMapper => {
	const actionType = UserActionType.BURN_TOKENS
	return {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
		actionType,
		particleGroupsFromAction: (
			input: MapperInput,
		): Result<ParticleGroup[], Error> =>
			validate(
				validateUserActionSender,
				validateUserActionType(actionType),
				validateConsumeTokensAction(tokenDefinitionValidation),
			)(input)
				.andThen((res) => combine(collectUpParticles(res)))
				.andThen((upParticles) =>
					particleGroupsFromBurnTokensAction({
						burnTokensAction: input.action as BurnTokensAction,
						upParticles: upParticles,
						addressOfActiveAccount: input.addressOfActiveAccount,
					}),
				),
	}
}
