import { makeTransitioner } from "../dist/fungibleParticleTransitioner";
import { ParticleBase, TransferrableTokensParticle } from "@radixdlt/atom";
import { Amount, amountInSmallestDenomination } from "@radixdlt/primitives";
import { UInt256 } from "@radixdlt/uint256";
import { v4 as uuidv4 } from "uuid";
import { ok } from "neverthrow";
import { FungibleParticleTransition } from "../src/_types";

const numberOfParticlesInTransition = <F extends ParticleBase, T extends ParticleBase>(transition: FungibleParticleTransition<F, T>): number => {
	return transition.transitioned.length + transition.removed.length + transition.migrated.length
}

describe('fungibleParticleTransitioner', () => {

	const two = amountInSmallestDenomination(UInt256.valueOf(2))

	type TestParticle = ParticleBase & {
		amount: Amount,
		id: string
	}

	const testParticle = (amount: number | Amount, id?: string): TestParticle => {
		const id_ = id ?? uuidv4()
		const amount_ = typeof amount === 'number' ? amountInSmallestDenomination(UInt256.valueOf(amount)) : amount
		return {
			amount: amount_,
			id: id_,
			equals: (other) => (other as TestParticle).id === id_
		}
	}

	const fromTestParticle = (from: TestParticle, amount: Amount): TestParticle => {
		return testParticle(amount, from.id)
	}

	const transitioner = makeTransitioner<TestParticle, TestParticle>({
		transitioner: (from, amount) => ok(fromTestParticle(from, amount)),
		migrator: (from, amount) => ok(fromTestParticle(from, amount)),
		amountMapper: (p) => ok(p.amount)
	})

	it('should create a transition with two particles is output when TWO to 2', () => {

		const particle = testParticle(2)
		const transition = transitioner.transition({
			unconsumedFungibles: [particle],
			toAmount: two
		})._unsafeUnwrap()

		expect(numberOfParticlesInTransition(transition)).toBe(2)
		expect(transition.removed[0].equals(particle)).toBe(true)
		expect(transition.transitioned[0].equals(particle)).toBe(true)
		expect(transition.migrated).toStrictEqual([])
	})

	it('should fail if insufficient funds', () => {

		const particle = testParticle(1)
		const transitionResult = transitioner.transition({
			unconsumedFungibles: [particle],
			toAmount: two
		})

		transitionResult.match(
			() => {
				throw Error('expected error, but got none')
			},
			(e) =>
				expect(e.message).toBe(
					`Insufficient balance.`,
				),
		)
	})
})
