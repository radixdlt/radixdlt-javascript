import { FungibleParticleTransitioner } from './_types'
import {
	AnySpunParticle,
	spunDownParticle,
	ParticleBase,
	spunUpParticle,
} from '@radixdlt/atom'
import { Amount, zero } from '@radixdlt/primitives'
import { Result, err, ok } from 'neverthrow'

/* eslint-disable functional/immutable-data, functional/no-let, functional/no-loop-statement, prefer-const, max-lines-per-function */
export const makeTransitioner = <
	From extends ParticleBase,
	To extends ParticleBase
>(
	input: Readonly<{
		inputAmountMapper: (from: From) => Amount
		inputCreator: (amount: Amount, from: From) => Result<From, Error>
		outputCreator: (amount: Amount, from: From) => Result<To, Error>
	}>,
): FungibleParticleTransitioner<From> => {
	const inputAmountMapper = input.inputAmountMapper
	const inputCreator = input.inputCreator
	const outputCreator = input.outputCreator

	return {
		// eslint-disable-next-line complexity
		transition: (
			input: Readonly<{
				currentParticles: From[]
				totalAmountToTransfer: Amount
			}>,
		): Result<AnySpunParticle[], Error> => {
			let spunParticles: AnySpunParticle[] = []

			let amountLeftToTransfer = input.totalAmountToTransfer

			for (const currentParticle of input.currentParticles) {
				spunParticles.push(spunDownParticle(currentParticle))
				const particleAmount = inputAmountMapper(currentParticle)
				if (particleAmount.greaterThan(amountLeftToTransfer)) {
					const sendBackToSelf = particleAmount
						.subtracting(amountLeftToTransfer)
						.unwrapOr(zero)

					const migratedResult = inputCreator(
						sendBackToSelf,
						currentParticle,
					)
					if (migratedResult.isErr())
						return err(new Error('Failed to migrate particle'))

					spunParticles.push(spunUpParticle(migratedResult.value))
				}

				if (particleAmount.greaterThanOrEquals(amountLeftToTransfer)) {
					const outputResult = outputCreator(
						input.totalAmountToTransfer,
						currentParticle,
					)

					if (outputResult.isErr())
						return err(
							new Error('Failed to create output particle'),
						)

					spunParticles.push(spunUpParticle(outputResult.value))
					return ok(spunParticles)
				}

				amountLeftToTransfer = amountLeftToTransfer
					.subtracting(particleAmount)
					.unwrapOr(zero)
			}
			return err(new Error('Insufficient balance.'))
		},
	}
}

export const makeSimpleTransitioner = <
	From extends ParticleBase,
	To extends ParticleBase
>(
	input: Readonly<{
		inputAmountMapper: (from: From) => Amount
		inputCreator: (amount: Amount) => From
		outputCreator: (amount: Amount) => To
	}>,
): FungibleParticleTransitioner<From> => {
	return makeTransitioner({
		...input,
		inputCreator: (amount: Amount, _: From) =>
			ok(input.inputCreator(amount)),
		outputCreator: (amount: Amount, _: From) =>
			ok(input.outputCreator(amount)),
	})
}
