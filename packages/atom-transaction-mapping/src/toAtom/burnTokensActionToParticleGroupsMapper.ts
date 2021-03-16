import { UserActionType } from '@radixdlt/actions'
import {
	isMutableTokenDefinitionParticle,
	ParticleGroup,
	spunParticles,
	TokenDefinitionParticleBase,
	unallocatedTokensParticle,
	UpParticle,
} from '@radixdlt/atom'
import { AddressT } from '@radixdlt/account'
import { err, Result, ok, combine } from 'neverthrow'
import { BurnTokensActionToParticleGroupsMapper, MapperInput } from './_types'
import { makeTransitioner } from './fungibleParticleTransitioner'
import {
	validate,
	validateConsumeTokensAction,
	validateUserActionSender,
	validateUserActionType,
} from './validation'
import {
	collectUpParticles,
	transferrableTokensParticleFromOther,
} from './utils'
import { ValidationWitness } from '@radixdlt/util'
import {
	ParticleGroupT,
	TransferrableTokensParticleT,
	UnallocatedTokensParticleT,
} from '@radixdlt/atom/src/_index'
import { BurnTokensActionT } from '@radixdlt/actions/src/_types'

const particleGroupsFromBurnTokensAction = (
	input: Readonly<{
		burnTokensAction: BurnTokensActionT
		upParticles: UpParticle<TransferrableTokensParticleT>[]
		addressOfActiveAccount: AddressT
	}>,
): Result<ParticleGroupT[], Error> => {
	const burnAction = input.burnTokensAction

	const transitioner = makeTransitioner<
		TransferrableTokensParticleT,
		UnallocatedTokensParticleT
	>({
		inputAmountMapper: (from: TransferrableTokensParticleT) => from.amount,
		inputCreator: transferrableTokensParticleFromOther.bind(
			null,
			burnAction.sender,
		),
		outputCreator: (amount, fromTTP) =>
			ok(
				unallocatedTokensParticle({
					...fromTTP,
					permissions: fromTTP.permissions.permissions,
					amount,
					nonce: undefined, // IMPORTANT to not reuse nonce.
				}),
			),
	})

	const consumableParticles = input.upParticles
		.map((sp): TransferrableTokensParticleT => sp.particle)
		.filter((p: TransferrableTokensParticleT) =>
			p.resourceIdentifier.equals(burnAction.resourceIdentifier),
		)

	return transitioner
		.transition({
			currentParticles: consumableParticles,
			totalAmountToTransfer: burnAction.amount,
		})
		.map((spp) => spunParticles(spp))
		.map((sps) => [ParticleGroup.create(sps)])
}

const tokenDefinitionValidation = (input: {
	tokenDefinitionParticle: TokenDefinitionParticleBase
	burner: AddressT
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
	return ok({ witness: 'Has permission to burn' })
}

export const burnTokensActionToParticleGroupsMapper = (): BurnTokensActionToParticleGroupsMapper => {
	const actionType = UserActionType.BURN_TOKENS
	return {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
		actionType,
		particleGroupsFromAction: (
			input: MapperInput,
		): Result<ParticleGroupT[], Error> =>
			validate(
				validateUserActionSender,
				validateUserActionType(actionType),
				validateConsumeTokensAction(tokenDefinitionValidation),
			)(input)
				.andThen((res) => combine(collectUpParticles(res)))
				.andThen((upParticles) =>
					particleGroupsFromBurnTokensAction({
						burnTokensAction: input.action as BurnTokensActionT,
						upParticles: upParticles,
						addressOfActiveAccount: input.addressOfActiveAccount,
					}),
				),
	}
}
