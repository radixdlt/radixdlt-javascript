import { TokensActionBase, UserAction, UserActionType } from '@radixdlt/actions'
import {
	AnyUpParticle,
	spunParticles,
	TokenDefinitionParticleBase,
} from '@radixdlt/atom'
import { Address } from '@radixdlt/crypto'
import { err, ok, Result } from 'neverthrow'
import { MapperInput } from './_types'

export const validate = (
	...validators: ((input: any) => Result<MapperInput, Error>)[]
) => (input: MapperInput) =>
	validators.reduce<Result<MapperInput, Error>>(
		(result, validator) => result.andThen(validator),
		ok(input),
	)

export const validateUserActionSender = <
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

export const validateConsumeTokensAction = (
	validateTokenDefinition?: (
		input: Readonly<{
			tokenDefinitionParticle: TokenDefinitionParticleBase
			burner: Address
		}>,
	) => Result<true, Error>,
) => <
	T extends Readonly<{
		upParticles: AnyUpParticle[]
		action: A
	}>,
	A extends TokensActionBase
>(
	input: T,
): Result<T, Error> => {
	const resourceIdentifier = input.action.tokenResourceIdentifier
	const tokenDefValidation = validateTokenDefinition ?? (() => ok(true))

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

	return tokenDefValidation({
		tokenDefinitionParticle,
		burner: input.action.sender,
	}).map((_) => input)
}

export const validateUserActionType = (filterOnType: UserActionType) => <
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
