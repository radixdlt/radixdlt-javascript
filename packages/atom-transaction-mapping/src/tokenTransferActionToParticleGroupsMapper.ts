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
	Spin,
	ParticleGroup,
	particleGroup,
	TokenDefinitionParticleBase,
	upParticle,
} from '@radixdlt/atom'
import { Address } from '@radixdlt/crypto'
import { combine, err, ok, Result } from 'neverthrow'
import { Amount } from '@radixdlt/primitives'
import { positiveAmount } from '@radixdlt/primitives'
import { makeTransitioner } from './fungibleParticleTransitioner'

type MapperInput = Readonly<{
	action: UserAction
	upParticles: AnyUpParticle[]
	addressOfActiveAccount: Address
}>

const validateUserActionSender = <
	T extends Readonly<{
		action: UserAction
		addressOfActiveAccount: Address
	}>
>(
	input: T,
): Result<T, Error> => {
	return input.action.sender.equals(input.addressOfActiveAccount)
		? ok(input)
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

const validateConsumeTokensAction = <
	T extends Readonly<{
		upParticles: AnyUpParticle[]
		action: A
		validateTokenDefinition?: (
			tokenDefintionParticleBase: TokenDefinitionParticleBase,
		) => Result<true, Error>
	}>,
	A extends TokensActionBase
>(
	input: T,
): Result<T, Error> => {
	const resourceIdentifier = input.action.tokenResourceIdentifier
	const validateTokenDefinition =
		input.validateTokenDefinition ??
		((_: TokenDefinitionParticleBase) => ok(true))

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

	if (
		!input.action.amount.isMultipleOf(tokenDefinitionParticle.granularity)
	) {
		return err(new Error('Amount not multiple of granularity'))
	}

	return validateTokenDefinition(tokenDefinitionParticle).map((_) => input)
}

const validateUserActionType = (filterOnType: UserActionType) => <
	T extends {
		action: UserAction
	}
>(
	input: T,
): Result<T, Error> => {
	if (input.action.actionType !== filterOnType)
		return err(new Error('Incorrect UserAction type.'))
	return ok(input)
}

// TODO: this should be removed
const validateActionInputForConsumeTokensAction = <A extends TokensActionBase>(
	input: Readonly<{
		typeOfThisMapper: UserActionType
		action: UserAction
		upParticles: AnyUpParticle[]
		addressOfActiveAccount: Address
		validateTokenDefinition?: (
			tokenDefintionParticleBase: TokenDefinitionParticleBase,
		) => Result<true, Error>
	}>,
): Result<A, Error> => {
	// @ts-ignore
	return validateUserActionSender(input)
		.andThen((action) =>
			validateUserActionType(input.typeOfThisMapper)(action),
		)
		.andThen((typedAction) =>
			validateConsumeTokensAction({
				...input,
				// @ts-ignore
				action: typedAction,
			}),
		)
}

// TODO: this should be removed
export const validateInputCollectUpParticles = <A extends TokensActionBase>(
	input: Readonly<{
		typeOfThisMapper: UserActionType
		action: UserAction
		upParticles: AnyUpParticle[]
		addressOfActiveAccount: Address
		validateTokenDefinition?: (
			tokenDefintionParticleBase: TokenDefinitionParticleBase,
		) => Result<true, Error>
	}>,
): Result<UpParticle<TransferrableTokensParticle>[], Error> => {
	return validateActionInputForConsumeTokensAction<A>(input).map((_) =>
		spunParticles(input.upParticles)
			.transferrableTokensParticles(Spin.UP)
			.filter((sp) =>
				sp.particle.address.equals(input.addressOfActiveAccount),
			)
			.map((sp) => asUpParticle(sp)._unsafeUnwrap()),
	)
}

export const collectUpParticles = (
	input: Readonly<{
		upParticles: AnyUpParticle[]
		addressOfActiveAccount: Address
	}>,
): Result<UpParticle<TransferrableTokensParticle>, Error>[] => {
	return spunParticles(input.upParticles)
		.transferrableTokensParticles(Spin.UP)
		.filter((sp) =>
			sp.particle.address.equals(input.addressOfActiveAccount),
		)
		.map((sp) => asUpParticle(sp))
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

const validate = (
	...validators: ((input: any) => Result<MapperInput, Error>)[]
) => (input: MapperInput) =>
	validators.reduce<Result<MapperInput, Error>>(
		(result, validator) => result.andThen(validator),
		ok(input),
	)

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
				validateConsumeTokensAction,
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
