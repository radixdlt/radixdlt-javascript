import {
	TokensActionBase,
	TransferTokensAction,
	UserAction,
	UserActionType,
} from '@radixdlt/actions'
import { TokenTransferActionToParticleGroupsMapper } from './_types'
import {
	spunParticles,
	asUpParticle,
	transferrableTokensParticle,
	AnyUpParticle,
	TransferrableTokensParticle,
	UpParticle,
	SpunParticles,
	Spin,
} from '@radixdlt/atom'
import { Address } from '@radixdlt/crypto'
import { err, ok, Result } from 'neverthrow'
import { Amount } from '@radixdlt/primitives'
import { positiveAmount } from '@radixdlt/primitives'
import { makeTransitioner } from './fungibleParticleTransitioner'

export const validateUserActionSender = (
	input: Readonly<{
		action: UserAction
		addressOfActiveAccount: Address
	}>,
): Result<UserAction, Error> => {
	return input.action.sender.equals(input.addressOfActiveAccount)
		? ok(input.action)
		: err(new Error('Wrong sender/signer'))
}

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

export const validateConsumeTokensAction = <A extends TokensActionBase>(
	input: Readonly<{
		action: A
		upParticles: AnyUpParticle[]
	}>,
): Result<A, Error> => {
	const action = input.action
	const resourceIdentifier = action.tokenResourceIdentifier

	const spunParticles_ = spunParticles(input.upParticles)

	const tokenDefinitionParticle = spunParticles_.tokenDefinitionParticleMatchingIdentifier(
		resourceIdentifier,
	)

	if (!tokenDefinitionParticle) {
		return err(
			new Error(
				`Unknown token with identifier: '${resourceIdentifier.toString()}'`,
			),
		)
	}

	if (!action.amount.isMultipleOf(tokenDefinitionParticle.granularity)) {
		return err(new Error('Amount not multiple of granularity'))
	}

	return ok(action)
}

const particleGroupsFromTransferTokensAction = (
	input: Readonly<{
		transferTokensAction: TransferTokensAction
		upParticles: UpParticle<TransferrableTokensParticle>[]
		addressOfActiveAccount: Address
	}>,
): Result<SpunParticles, Error> => {
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
}

export const validateUserActionType = <A extends UserAction>(
	input: Readonly<{
		action: UserAction
		filterOnType: UserActionType
	}>,
): Result<A, Error> => {
	if (input.action.actionType !== input.filterOnType)
		return err(new Error('Incorrect UserAction type.'))
	return ok(input.action as A)
}

export const tokenTransferActionToParticleGroupsMapper = (): TokenTransferActionToParticleGroupsMapper => {
	const actionType = UserActionType.TOKEN_TRANSFER
	return {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
		actionType,
		particleGroupsFromAction: (
			input: Readonly<{
				action: UserAction
				upParticles: AnyUpParticle[]
				addressOfActiveAccount: Address
			}>,
		): Result<SpunParticles, Error> => {
			return validateUserActionSender(input)
				.andThen((action) =>
					validateUserActionType<TransferTokensAction>({
						action,
						filterOnType: actionType,
					}),
				)
				.andThen((transferTokensAction) =>
					validateConsumeTokensAction({
						action: transferTokensAction,
						upParticles: input.upParticles,
					}),
				)
				.andThen((transferTokensAction) => {
					const upParticles: UpParticle<TransferrableTokensParticle>[] = spunParticles(
						input.upParticles,
					)
						.transferrableTokensParticles(Spin.UP)
						.map(
							(sp): UpParticle<TransferrableTokensParticle> =>
								asUpParticle<TransferrableTokensParticle>(
									sp,
								)._unsafeUnwrap(),
						)

					return particleGroupsFromTransferTokensAction({
						transferTokensAction,
						upParticles: upParticles,
						addressOfActiveAccount: input.addressOfActiveAccount,
					})
				})
		},
	}
}
