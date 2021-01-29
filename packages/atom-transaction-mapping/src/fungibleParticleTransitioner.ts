import { FungibleParticleTransitioner } from './_types'
import {
	AnySpunParticle,
	spunDownParticle,
	ParticleBase,
	spunUpParticle,
} from '@radixdlt/atom'
import { Amount } from '@radixdlt/primitives'
import { Result, err, ok } from 'neverthrow'

/* eslint-disable functional/immutable-data, functional/no-let, functional/no-try-statement, functional/no-loop-statement, prefer-const */

export const makeTransitioner = <
	From extends ParticleBase,
	To extends ParticleBase
>(
	input: Readonly<{
		inputAmountMapper: (from: From) => Amount
		inputCreator: (amount: Amount, from: From) => From
		outputCreator: (amount: Amount) => To
	}>,
): FungibleParticleTransitioner<From> => {
	const inputAmountMapper = input.inputAmountMapper
	const inputCreator = input.inputCreator
	const outputCreator = input.outputCreator

	return {
		transition: (
			input: Readonly<{
				currentParticles: From[]
				totalAmountToTransfer: Amount
			}>,
		): Result<AnySpunParticle[], Error> => {
			let spunParticles: AnySpunParticle[] = [
				spunUpParticle(outputCreator(input.totalAmountToTransfer)),
			]

			let amountLeftToTransfer = input.totalAmountToTransfer

			try {
				for (const currentParticle of input.currentParticles) {
					spunParticles.push(spunDownParticle(currentParticle))
					const particleAmount = inputAmountMapper(currentParticle)
					if (particleAmount.greaterThan(amountLeftToTransfer)) {
						const sendBackToSelf = particleAmount
							.subtracting(amountLeftToTransfer)
							._unsafeUnwrap()
						spunParticles.push(
							spunUpParticle(
								inputCreator(sendBackToSelf, currentParticle),
							),
						)
						return ok(spunParticles)
					} else if (particleAmount.equals(amountLeftToTransfer)) {
						return ok(spunParticles)
					}

					amountLeftToTransfer = amountLeftToTransfer
						.subtracting(particleAmount)
						._unsafeUnwrap()
				}
				return err(new Error('Insufficient balance.'))
			} catch (error) {
				return err(error)
			}
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
		inputCreator: (amount: Amount, _: From) => input.inputCreator(amount),
	})
}
