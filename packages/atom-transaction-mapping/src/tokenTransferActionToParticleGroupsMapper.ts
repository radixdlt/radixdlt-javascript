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
import { positiveAmount } from '@radixdlt/primitives'
import { makeTransitioner } from './fungibleParticleTransitioner'
import {
	validate,
	validateConsumeTokensAction,
	validateUserActionSender,
	validateUserActionType,
} from './validation'
import { collectUpParticles } from './utils'

export const transferrableTokensParticleFromParticle = (
	input: Readonly<{
		from: TransferrableTokensParticle
		amount: Amount
		address?: Address
	}>,
): TransferrableTokensParticle => {
	const positiveAmt = positiveAmount(input.amount)._unsafeUnwrap()
	return transferrableTokensParticle({
		...input.from,
		address: input.address ?? input.from.address,
		amount: positiveAmt,
	})._unsafeUnwrap()
}

const particleGroupsFromTransferTokensAction = (
	input: Readonly<{
		transferTokensAction: TransferTokensAction
		upParticles: UpParticle<TransferrableTokensParticle>[]
		addressOfActiveAccount: Address
	}>,
): Result<ParticleGroup[], Error> => {
	const transitioner = makeTransitioner<
		TransferrableTokensParticle,
		TransferrableTokensParticle
	>({
		inputAmountMapper: (from: TransferrableTokensParticle) => from.amount,
		inputCreator: (amount: Amount, from: TransferrableTokensParticle) =>
			transferrableTokensParticleFromParticle({
				amount,
				from,
				address: input.transferTokensAction.sender,
			}),
		outputCreator: (amount: Amount, from: TransferrableTokensParticle) =>
			transferrableTokensParticleFromParticle({
				amount: amount,
				from: from,
				address: input.transferTokensAction.recipient,
			}),
	})

	const consumableParticles = input.upParticles
		.map((sp) => sp.particle)
		.filter((p) =>
			p.tokenDefinitionReference.equals(
				input.transferTokensAction.tokenResourceIdentifier,
			),
		)

	return transitioner
		.transition({
			currentParticles: consumableParticles,
			totalAmountToTransfer: input.transferTokensAction.amount,
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
