import { TransferTokensAction, UserActionType } from '@radixdlt/actions'
import {
	MapperInput,
	TokenTransferActionToParticleGroupsMapper,
} from './_types'
import {
	spunParticles,
	transferrableTokensParticle,
	TransferrableTokensParticle,
	UpParticle,
	ParticleGroup,
	particleGroup,
} from '@radixdlt/atom'
import { Address } from '@radixdlt/crypto'
import { combine, Result } from 'neverthrow'
import { Amount } from '@radixdlt/primitives'
import { makeTransitioner } from './fungibleParticleTransitioner'
import {
	validate,
	validateConsumeTokensAction,
	validateUserActionSender,
	validateUserActionType,
} from './validation'
import { collectUpParticles } from './utils'

const particleGroupsFromTransferTokensAction = (
	input: Readonly<{
		transferTokensAction: TransferTokensAction
		upParticles: UpParticle<TransferrableTokensParticle>[]
		addressOfActiveAccount: Address
	}>,
): Result<ParticleGroup[], Error> => {
	const transferAction = input.transferTokensAction

	const newTTP = (
		address: Address,
		amount: Amount,
		from: TransferrableTokensParticle,
	): Result<TransferrableTokensParticle, Error> =>
		transferrableTokensParticle({
			...from,
			amount,
			address,
		})

	const transitioner = makeTransitioner<
		TransferrableTokensParticle,
		TransferrableTokensParticle
	>({
		inputAmountMapper: (from: TransferrableTokensParticle) => from.amount,
		inputCreator: newTTP.bind(null, transferAction.sender),
		outputCreator: newTTP.bind(null, transferAction.recipient),
	})

	const consumableParticles = input.upParticles
		.map((sp) => sp.particle)
		.filter((p) =>
			p.resourceIdentifier.equals(transferAction.resourceIdentifier),
		)

	return transitioner
		.transition({
			currentParticles: consumableParticles,
			totalAmountToTransfer: transferAction.amount,
		})
		.map((spp) => spunParticles(spp))
		.map((sps) => [particleGroup(sps)])
}

export const tokenTransferActionToParticleGroupsMapper = (): TokenTransferActionToParticleGroupsMapper => {
	const actionType = UserActionType.TOKEN_TRANSFER
	return {
		actionType,
		particleGroupsFromAction: (
			input: MapperInput,
		): Result<ParticleGroup[], Error> =>
			validate(
				validateUserActionSender,
				validateUserActionType(actionType),
				validateConsumeTokensAction(),
			)(input)
				.andThen((res) => combine(collectUpParticles(res)))
				.andThen((upParticles) =>
					particleGroupsFromTransferTokensAction({
						transferTokensAction: input.action as TransferTokensAction,
						upParticles: upParticles,
						addressOfActiveAccount: input.addressOfActiveAccount,
					}),
				),
	}
}
