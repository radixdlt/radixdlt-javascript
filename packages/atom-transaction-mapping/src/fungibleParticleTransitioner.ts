import {
	FungibleParticleTransition,
	FungibleParticleTransitioner,
} from './_types'
import { ParticleBase } from '@radixdlt/atom'
import {
	Amount,
	amountInSmallestDenomination,
	min,
} from '@radixdlt/primitives'
import { Result, err, ok } from 'neverthrow'
import { UInt256 } from '@radixdlt/uint256'

const zeroAmount = amountInSmallestDenomination(UInt256.valueOf(0))

export const sum = (amounts: Amount[], initial?: Amount): Amount =>
	amounts.reduce(
		(acc, el) => acc.adding(el)._unsafeUnwrap(),
		initial ?? zeroAmount,
	)

// eslint-disable-next-line max-lines-per-function
export const makeTransitioner = <
	From extends ParticleBase,
	To extends ParticleBase
>(
	input: Readonly<{
		transitioner: (from: From, amount: Amount) => Result<To, Error>
		migrator: (from: From, amount: Amount) => Result<From, Error>
		amountMapper: (from: From) => Result<Amount, Error>
	}>,
): FungibleParticleTransitioner<From, To> => {
	type Transition = FungibleParticleTransition<From, To>
	type TransitionIntermediate = Transition &
		Readonly<{
			consumedSoFar: Amount
		}>
	const finalize = (intermediate: TransitionIntermediate): Transition => ({
		removed: intermediate.removed,
		migrated: intermediate.migrated,
		transitioned: intermediate.transitioned,
	})

	const amountMapper = input.amountMapper
	const migrator = input.migrator
	const transitioner = input.transitioner

	return {
		// eslint-disable-next-line max-lines-per-function,complexity
		transition: (
			input: Readonly<{
				unconsumedFungibles: From[]
				toAmount: Amount
			}>,
		): Result<Transition, Error> => {
			const unconsumedFungibles = input.unconsumedFungibles
			const toAmount = input.toAmount

			// eslint-disable-next-line functional/no-try-statement
			try {
				const amounts = unconsumedFungibles.map((f) =>
					amountMapper(f)._unsafeUnwrap(),
				)
				const balance = sum(amounts, zeroAmount)

				if (balance < toAmount)
					return err(new Error('Insufficient balance.'))

				const intermediate = unconsumedFungibles.reduceBreak({
					initialValue: <TransitionIntermediate>{
						removed: [],
						migrated: [],
						transitioned: [],
						consumedSoFar: zeroAmount,
					},
					accumulator: (
						accumulated: TransitionIntermediate,
						currentElement: From,
					): TransitionIntermediate => {
						const left = toAmount
							.subtracting(accumulated.consumedSoFar)
							._unsafeUnwrap()

						const particleAmount = amountMapper(
							currentElement,
						)._unsafeUnwrap()

						const amountToTransfer = min(left, particleAmount)

						const amountToKeep = particleAmount
							.subtracting(amountToTransfer)
							._unsafeUnwrap()

						return <TransitionIntermediate>{
							consumedSoFar: accumulated.consumedSoFar
								.adding(particleAmount)
								._unsafeUnwrap(),
							transitioned: accumulated.transitioned.concat(
								transitioner(
									currentElement,
									amountToTransfer,
								)._unsafeUnwrap(),
							),
							migrated: amountToKeep.greaterThan(zeroAmount)
								? accumulated.migrated.concat(
										migrator(
											currentElement,
											amountToKeep,
										)._unsafeUnwrap(),
								  )
								: accumulated.migrated,
							removed: accumulated.removed.concat(currentElement),
						}
					},
					breakOn: (accumulated: TransitionIntermediate, _1, _2) =>
						accumulated.consumedSoFar.greaterThanOrEquals(toAmount),
				})

				return ok(finalize(intermediate))
			} catch (error) {
				return err(error)
			}
		},
	}
}
