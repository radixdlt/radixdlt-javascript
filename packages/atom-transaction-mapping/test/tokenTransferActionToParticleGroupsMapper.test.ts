import { tokenTransferActionToParticleGroupsMapper } from '../src/tokenTransferActionToParticleGroupsMapper'
import { TransferTokensAction, transferTokensAction } from '@radixdlt/actions'
import {
	AnyUpParticle,
	Spin,
	TokenDefinitionParticleBase,
	TransferrableTokensParticle,
	upParticle,
} from '@radixdlt/atom'
import { positiveAmountFromUnsafe } from '@radixdlt/primitives'
import {
	testMapperReturns___Unknown_Token___error_when_no_token_definition_particle,
	testMapperReturns___Insufficient_Balance___error_when_no_transferrable_tokens_particles,
	testMapperReturns___Insufficient_Balance___error_when_not_enough_transferrable_tokens_particles,
	testMapperReturns___Wrong_Sender___error_when_addressOfActiveAccount_is_someone_elses,
	testMapperReturns___Insufficient_Balance___error_when_some_of_transferrable_tokens_particles_belongs_to_someone_else,
	bob,
	rri,
	alice,
	upTTP,
	fixedSupTokDefParticle,
	TestCaseReturn,
	TestCase,
	TestVector,
	mutableSupplyTokenDefinitionParticleAllCanMutate,
} from './consumeTokensActionToParticleGroupsMapperBase'
import { Address } from '@radixdlt/crypto'

const testMapperReturns___works_with_change = <
	T extends TokenDefinitionParticleBase
>(
	testVector: TestVector<T>,
): TestCaseReturn =>
	it(`should work with a ${testVector.tokenDefinitionParticle.radixParticleType} and some TransferrableTokensParticles with change back.`, () => {
		const mapper = testVector.mapper
		const action = testVector.makeAction(4)
		expect(mapper.actionType).toBe(action.actionType)

		const spunUpParticles: AnyUpParticle[] = [
			upParticle(testVector.tokenDefinitionParticle),
			upTTP(2, testVector.tokenDefinitionParticle),
			upTTP(3, testVector.tokenDefinitionParticle),
		].map((p) => p.eraseToAnyUp())

		const particleGroups = mapper
			.particleGroupsFromAction({
				action: action,
				upParticles: spunUpParticles,
				addressOfActiveAccount: alice,
			})
			._unsafeUnwrap()

		expect(particleGroups.length).toBe(1)
		const spunParticles = particleGroups[0].spunParticles.spunParticles
		expect(spunParticles.length).toBe(4)

		const one = positiveAmountFromUnsafe(1)._unsafeUnwrap()
		const two = positiveAmountFromUnsafe(2)._unsafeUnwrap()
		const three = positiveAmountFromUnsafe(3)._unsafeUnwrap()
		const four = positiveAmountFromUnsafe(4)._unsafeUnwrap()

		const sp0 = spunParticles[0]
		expect(sp0.spin).toBe(Spin.DOWN)
		const p0 = sp0.particle as TransferrableTokensParticle
		expect(p0.amount.equals(two)).toBe(true)

		const sp1 = spunParticles[1]
		expect(sp1.spin).toBe(Spin.DOWN)
		const p1 = sp1.particle as TransferrableTokensParticle
		expect(p1.amount.equals(three)).toBe(true)

		// Change back to Alice
		const sp2 = spunParticles[2]
		expect(sp2.spin).toBe(Spin.UP)
		const p2 = sp2.particle as TransferrableTokensParticle
		expect(p2.amount.equals(one)).toBe(true)
		expect(p2.address.equals(alice)).toBe(true)

		const sp3 = spunParticles[3]
		expect(sp3.spin).toBe(Spin.UP)
		const p3 = sp3.particle as TransferrableTokensParticle
		expect(p3.amount.equals(four)).toBe(true)
		expect(p3.address.equals(bob)).toBe(true)
	})

const testMapperReturns___works_without_change = <
	T extends TokenDefinitionParticleBase
>(
	testVector: TestVector<T>,
): TestCaseReturn =>
	it(`should work with a ${testVector.tokenDefinitionParticle.radixParticleType} and some TransferrableTokensParticles with no change back.`, () => {
		const mapper = testVector.mapper
		const action = testVector.makeAction(5)
		expect(mapper.actionType).toBe(action.actionType)

		const spunUpParticles: AnyUpParticle[] = [
			upParticle(testVector.tokenDefinitionParticle),
			upTTP(2, testVector.tokenDefinitionParticle),
			upTTP(3, testVector.tokenDefinitionParticle),
		].map((p) => p.eraseToAnyUp())

		const particleGroups = mapper
			.particleGroupsFromAction({
				action: action,
				upParticles: spunUpParticles,
				addressOfActiveAccount: alice,
			})
			._unsafeUnwrap()

		expect(particleGroups.length).toBe(1)
		const spunParticles = particleGroups[0].spunParticles.spunParticles
		expect(spunParticles.length).toBe(3)

		const two = positiveAmountFromUnsafe(2)._unsafeUnwrap()
		const three = positiveAmountFromUnsafe(3)._unsafeUnwrap()
		const five = positiveAmountFromUnsafe(5)._unsafeUnwrap()

		const sp0 = spunParticles[0]
		expect(sp0.spin).toBe(Spin.DOWN)
		const p0 = sp0.particle as TransferrableTokensParticle
		expect(p0.amount.equals(two)).toBe(true)

		const sp1 = spunParticles[1]
		expect(sp1.spin).toBe(Spin.DOWN)
		const p1 = sp1.particle as TransferrableTokensParticle
		expect(p1.amount.equals(three)).toBe(true)

		const sp2 = spunParticles[2]
		expect(sp2.spin).toBe(Spin.UP)
		const p2 = sp2.particle as TransferrableTokensParticle
		expect(p2.amount.equals(five)).toBe(true)
		expect(p2.address.equals(bob)).toBe(true)
	})

describe('TokenTransferActionToParticleGroupsMapper', () => {
	const mapper = tokenTransferActionToParticleGroupsMapper()

	const makeTransferAction = (
		amount: number = 1337,
		actor?: Address,
	): TransferTokensAction => {
		return transferTokensAction({
			to: bob,
			from: actor ?? alice,
			amount: positiveAmountFromUnsafe(amount)._unsafeUnwrap(),
			resourceIdentifier: rri,
		})
	}

	const testTransferActionWithToken = <T extends TokenDefinitionParticleBase>(
		tokenDefinitionParticle: T,
	): void => {
		const tests: TestCase<T>[] = [
			testMapperReturns___Unknown_Token___error_when_no_token_definition_particle,
			testMapperReturns___Insufficient_Balance___error_when_no_transferrable_tokens_particles,
			testMapperReturns___Insufficient_Balance___error_when_not_enough_transferrable_tokens_particles,
			testMapperReturns___Wrong_Sender___error_when_addressOfActiveAccount_is_someone_elses,
			testMapperReturns___Insufficient_Balance___error_when_some_of_transferrable_tokens_particles_belongs_to_someone_else,

			// Transfer specific
			testMapperReturns___works_with_change,
			testMapperReturns___works_without_change,
		]

		const vector = <TestVector<T>>{
			mapper,
			makeAction: makeTransferAction,
			tokenDefinitionParticle: tokenDefinitionParticle,
		}

		tests.forEach((t) => t(vector))
	}

	describe('Transfer FixedSupply token', () => {
		testTransferActionWithToken(fixedSupTokDefParticle)
	})

	describe('Transfer MutableSupply token', () => {
		testTransferActionWithToken(
			mutableSupplyTokenDefinitionParticleAllCanMutate,
		)
	})
})
