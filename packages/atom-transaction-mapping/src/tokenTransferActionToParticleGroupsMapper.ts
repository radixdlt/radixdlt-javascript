import {
	TransferTokensAction,
	UserAction,
	UserActionType,
} from '@radixdlt/actions'
import { TokenTransferActionToParticleGroupsMapper } from './_types'
import {
	AnyUpParticle,
	SpunParticles,
	spunParticles,
	Spin,
	TransferrableTokensParticle,
	UpParticle,
	asUpParticle,
} from '@radixdlt/atom'
import { Address } from '@radixdlt/crypto'
import { err, ok, Result } from 'neverthrow'

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

const particleGroupsFromTransferTokensAction = (
	input: Readonly<{
		transferTokensAction: TransferTokensAction
		upParticles: UpParticle<TransferrableTokensParticle>[]
		addressOfActiveAccount: Address
	}>,
): Result<SpunParticles, Error> => {
	return err(new Error('imple me'))
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

export const makeTokenTransferActionToParticleGroupsMapper = (): TokenTransferActionToParticleGroupsMapper => {
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
			return validateUserActionSender(input).andThen((action) =>
				validateUserActionType<TransferTokensAction>({
					action,
					filterOnType: actionType,
				}).andThen((transferTokensAction) => {
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
				}),
			)
		},
	}
}
