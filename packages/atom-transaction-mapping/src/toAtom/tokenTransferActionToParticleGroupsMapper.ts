import { TransferTokensAction, UserActionType } from '@radixdlt/actions'
import {
	MapperInput,
	TokenTransferActionToParticleGroupsMapper,
} from './_types'
import {
	spunParticles,
	UpParticle,
	ParticleGroup,
	particleGroup,
} from '@radixdlt/atom'
import { Address, AddressT } from '@radixdlt/crypto'
import { combine, Result } from 'neverthrow'
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
import {
	ParticleGroupT,
	TransferrableTokensParticleT,
} from '@radixdlt/atom/src/_index'

const particleGroupsFromTransferTokensAction = (
	input: Readonly<{
		transferTokensAction: TransferTokensAction
		upParticles: UpParticle<TransferrableTokensParticleT>[]
		addressOfActiveAccount: AddressT
	}>,
): Result<ParticleGroupT[], Error> => {
	const transferAction = input.transferTokensAction

	const transitioner = makeTransitioner<
		TransferrableTokensParticleT,
		TransferrableTokensParticleT
	>({
		inputAmountMapper: (from: TransferrableTokensParticleT) => from.amount,
		inputCreator: transferrableTokensParticleFromOther.bind(
			null,
			transferAction.sender,
		),
		outputCreator: transferrableTokensParticleFromOther.bind(
			null,
			transferAction.recipient,
		),
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
		): Result<ParticleGroupT[], Error> =>
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
