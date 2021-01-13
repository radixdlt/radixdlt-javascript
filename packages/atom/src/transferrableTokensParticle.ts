import {
	amountFromUnsafe,
	AmountInputUnsafe,
	Granularity,
	Amount,
	isAmount,
	isUnsafeInputForUInt256,
	PositiveAmount,
	positiveAmount,
	randomNonce,
} from '@radixdlt/primitives'
import { Address, addressFromBase58String, isAddress } from '@radixdlt/crypto'
import { ResourceIdentifier, TransferrableTokensParticle } from './_types'

import { Result, err, ok } from 'neverthrow'
import { resourceIdentifierFromString, isResourceIdentifier } from './_index'

export const transferrableTokensParticle = (
	input: Readonly<{
		address: Address
		tokenDefinitionReference: ResourceIdentifier
		granularity: Granularity
		amount: PositiveAmount
	}>,
): Result<TransferrableTokensParticle, Error> => {
	if (!input.amount.isMultipleOf(input.granularity)) {
		return err(new Error('Amount not multiple of granularity'))
	}

	const nonce = randomNonce()

	return ok({
		address: input.address,
		tokenDefinitionReference: input.tokenDefinitionReference,
		granularity: input.granularity,
		nonce,
		amount: input.amount,
	})
}

const tryAddress = (input: Address | string): Result<Address, Error> => {
	return isAddress(input)
		? ok(input)
		: typeof input === 'string'
		? addressFromBase58String(input)
		: err(new Error('bad type'))
}

const tryRRI = (
	input: ResourceIdentifier | string,
): Result<ResourceIdentifier, Error> => {
	return isResourceIdentifier(input)
		? ok(input)
		: resourceIdentifierFromString(input)
}

const tryAmount = (
	input: Amount | AmountInputUnsafe,
): Result<Amount, Error> => {
	return isAmount(input)
		? ok(input)
		: isUnsafeInputForUInt256(input)
		? amountFromUnsafe(input)
		: err(new Error('bad type'))
}

// type DeleteMeWitness = {
// 	address: Address
// }

/* eslint-disable complexity */
export const transferrableTokensParticleFromUnsafe = (
	input: Readonly<{
		address: Address | string
		tokenDefinitionReference: ResourceIdentifier | string
		granularity: Granularity | AmountInputUnsafe
		amount: PositiveAmount | AmountInputUnsafe
	}>,
): Result<TransferrableTokensParticle, Error> => {
	const address = tryAddress(input.address)
	const tokenDefinitionReference = tryRRI(input.tokenDefinitionReference)
	const granularity: Result<Granularity, Error> = tryAmount(input.granularity)
	const amount: Result<PositiveAmount, Error> = tryAmount(
		input.granularity,
	).andThen(positiveAmount)

	if (
		address.isOk &&
		tokenDefinitionReference.isOk &&
		granularity.isOk &&
		amount.isOk
	) {
		console.log(`❤️ ALL OK! :D`)
	}

	// return combine([
	// 	address,
	// 	tokenDefinitionReference,
	// 	granularity,
	// 	amount
	// ])
	// .map((resultList) => {
	// 	address: resultList[0]
	// 	tokenDefinitionReference: resultList[1]
	// 	granularity: resultList[2]
	// 	amount: resultList[3]
	// })
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	// const apa: Result<DeleteMeWitness, Error> = ok({}).andThen((object) =>
	// 	ok({ ...object, address: address }),
	// )
	// .map({...tokenDefinitionReference})
	// .map({...granularity})
	// .map({...amount})
	// .map(transferrableTokensParticle)

	return err(new Error('bad cat'))
}
