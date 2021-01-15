import { Address, addressFromUnsafe } from '@radixdlt/crypto'
import {
	ResourceIdentifier,
	TokenPermissions,
	TransferrableTokensParticle,
} from '../src/_types'
import {
	amountFromUnsafe,
	AmountInputUnsafe,
	Granularity,
	positiveAmount,
	PositiveAmount,
} from '@radixdlt/primitives'
import { combine, Result } from 'neverthrow'
import { resourceIdentifierFromUnsafe } from '../src/resourceIdentifier'
import {
	transferrableTokensParticle,
	TTPInput,
} from '../src/transferrableTokensParticle'

export const transferrableTokensParticleFromUnsafe = (
	input: Readonly<{
		address: Address | string
		tokenDefinitionReference: ResourceIdentifier | string
		granularity: Granularity | AmountInputUnsafe
		amount: PositiveAmount | AmountInputUnsafe
		permissions?: TokenPermissions
	}>,
): Result<TransferrableTokensParticle, Error> => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	const address = addressFromUnsafe(input.address)
	const tokenDefinitionReference = resourceIdentifierFromUnsafe(
		input.tokenDefinitionReference,
	)
	const granularity: Result<Granularity, Error> = amountFromUnsafe(
		input.granularity,
	)
	const amount: Result<PositiveAmount, Error> = amountFromUnsafe(
		input.amount,
	).andThen(positiveAmount)

	return combine([address, tokenDefinitionReference, granularity, amount])
		.map(
			(resultList) =>
				<TTPInput>{
					address: resultList[0],
					tokenDefinitionReference: resultList[1],
					granularity: resultList[2],
					amount: resultList[3],
					permissions: input.permissions,
				},
		)
		.andThen(transferrableTokensParticle)
}
