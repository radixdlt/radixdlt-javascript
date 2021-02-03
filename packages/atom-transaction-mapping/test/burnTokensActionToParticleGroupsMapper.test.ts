import { burnTokensActionToParticleGroupsMapper } from '../src/burnTokensActionToParticleGroupsMapper'
import {
	burnTokensAction,
	BurnTokensAction,
	UserActionType,
} from '@radixdlt/actions'
import {
	isTransferrableTokensParticle,
	MutableSupplyTokenDefinitionParticle,
	TokenDefinitionParticleBase,
	TokenParticle,
	upParticle,
} from '@radixdlt/atom'
import { positiveAmountFromUnsafe } from '@radixdlt/primitives'
import {
	testMapperReturns___Unknown_Token___error_when_no_token_definition_particle,
	testMapperReturns___Insufficient_Balance___error_when_no_transferrable_tokens_particles,
	testMapperReturns___Insufficient_Balance___error_when_not_enough_transferrable_tokens_particles,
	testMapperReturns___Wrong_Sender___error_when_addressOfActiveAccount_is_someone_elses,
	testMapperReturns___Insufficient_Balance___error_when_some_of_transferrable_tokens_particles_belongs_to_someone_else,
	testMapperReturns___works_with_change,
	testMapperReturns___works_without_change,
	rri,
	alice,
	bob,
	fixedSupTokDefParticle,
	TestCase,
	TestVector,
	TestCaseReturn,
	mutableSupplyTokenDefinitionParticleAllCanMutate,
	mutableSupplyTokenDefinitionParticleOnlyAliceCanMutate,
} from './consumeTokensActionToParticleGroupsMapperBase'
import { FixedSupplyTokenDefinitionParticle } from '@radixdlt/atom/src/particles/_types'
import { RadixParticleType } from '@radixdlt/atom/src/particles/meta/radixParticleTypes'
import { Address } from '@radixdlt/crypto'
import { isUnallocatedTokensParticle } from '@radixdlt/atom/src/particles/unallocatedTokensParticle'

const testMapperReturns___Can_Only_Burn_Mutable_Tokens___error_when_trying_to_burn_FixedSupplyTokenDefinition = <
	T extends TokenDefinitionParticleBase
>(
	testVector: TestVector<T>,
): TestCaseReturn =>
	it(`should fail with error 'Can only burn mutable tokens' when some trying to burn FixedSupplyTokenDefinition.`, () => {
		const mapper = testVector.mapper
		const action = testVector.makeAction(4)
		expect(mapper.actionType).toBe(UserActionType.BURN_TOKENS)
		const tokenDefParticle = testVector.tokenDefinitionParticle
		expect(
			tokenDefParticle.radixParticleType ===
				RadixParticleType.FIXED_SUPPLY_TOKEN_DEFINITION,
		)

		const particleGroupsResult = mapper.particleGroupsFromAction({
			action: action,
			upParticles: [upParticle(tokenDefParticle).eraseToAnyUp()],
			addressOfActiveAccount: alice,
		})

		particleGroupsResult.match(
			() => {
				throw Error('expected error, but got none')
			},
			(f) =>
				expect(f.message).toBe(
					`Can only burn tokens with mutable supply.`,
				),
		)
	})

const testMapperReturns___NotPermissionToBurn___error_when_trying_to_burn_MutableSupplyTokenDefinition_without_permission = <
	T extends TokenDefinitionParticleBase
>(
	testVector: TestVector<T>,
): TestCaseReturn =>
	it(`should fail with error 'Not permission to burn token' when some trying to burn MutableSupplyTokenDefinition with.`, () => {
		const mapper = testVector.mapper
		const action = testVector.makeAction(4, bob)
		expect(mapper.actionType).toBe(UserActionType.BURN_TOKENS)
		const tokenDefParticle = testVector.tokenDefinitionParticle as MutableSupplyTokenDefinitionParticle
		expect(
			tokenDefParticle.radixParticleType ===
				RadixParticleType.MUTABLE_SUPPLY_TOKEN_DEFINITION,
		)
		expect(tokenDefParticle.permissions.canBeBurned(() => false)).toBe(
			false,
		)

		const particleGroupsResult = mapper.particleGroupsFromAction({
			action: action,
			upParticles: [upParticle(tokenDefParticle).eraseToAnyUp()],
			addressOfActiveAccount: bob,
		})

		particleGroupsResult.match(
			() => {
				throw Error('expected error, but got none')
			},
			(f) => expect(f.message).toBe(`Not permission to burn token.`),
		)
	})

const testMapperReturns_burn_works_with_change = testMapperReturns___works_with_change.bind(
	null,
	(migratedParticle: TokenParticle): void => {
		if (!isTransferrableTokensParticle(migratedParticle))
			throw new Error(`Expected output particle to be TTP`)
		expect(migratedParticle.address.equals(alice)).toBe(true)
	},

	(outputParticle: TokenParticle): void => {
		expect(isUnallocatedTokensParticle(outputParticle)).toBe(true)
	},
)

const testMapperReturns_burn_works_without_change = testMapperReturns___works_without_change.bind(
	null,
	(outputParticle: TokenParticle): void => {
		expect(isUnallocatedTokensParticle(outputParticle)).toBe(true)
	},
)

describe('BurnTokensActionToParticleGroupsMapper', () => {
	const mapper = burnTokensActionToParticleGroupsMapper()

	const makeBurnAction = (
		amount: number = 1337,
		actor?: Address,
	): BurnTokensAction => {
		return burnTokensAction({
			burner: actor ?? alice,
			amount: positiveAmountFromUnsafe(amount)._unsafeUnwrap(),
			resourceIdentifier: rri,
		})
	}

	const testBurnActionWithToken = <T extends TokenDefinitionParticleBase>(
		input: Readonly<{
			tokenDefinitionParticle: T
			tests: TestCase<T>[]
		}>,
	): void => {
		const vector = <TestVector<T>>{
			mapper,
			makeAction: makeBurnAction,
			tokenDefinitionParticle: input.tokenDefinitionParticle,
		}

		input.tests.forEach((t) => t(vector))
	}

	describe('Burn FixedSupply token', () => {
		testBurnActionWithToken({
			tokenDefinitionParticle: fixedSupTokDefParticle,
			tests: [
				testMapperReturns___Unknown_Token___error_when_no_token_definition_particle,
				testMapperReturns___Wrong_Sender___error_when_addressOfActiveAccount_is_someone_elses,

				// Burn specific
				testMapperReturns___Can_Only_Burn_Mutable_Tokens___error_when_trying_to_burn_FixedSupplyTokenDefinition,
			],
		})
	})

	describe('Burn MutableSupply token that all can mutate', () => {
		testBurnActionWithToken({
			tokenDefinitionParticle: mutableSupplyTokenDefinitionParticleAllCanMutate,
			tests: [
				testMapperReturns_burn_works_with_change,
				testMapperReturns_burn_works_without_change,

				testMapperReturns___Unknown_Token___error_when_no_token_definition_particle,
				testMapperReturns___Insufficient_Balance___error_when_no_transferrable_tokens_particles,
				testMapperReturns___Insufficient_Balance___error_when_not_enough_transferrable_tokens_particles,
				testMapperReturns___Wrong_Sender___error_when_addressOfActiveAccount_is_someone_elses,
				testMapperReturns___Insufficient_Balance___error_when_some_of_transferrable_tokens_particles_belongs_to_someone_else,
			],
		})
	})

	describe('Burn MutableSupply token that only Alice can mutate', () => {
		testBurnActionWithToken({
			tokenDefinitionParticle: mutableSupplyTokenDefinitionParticleOnlyAliceCanMutate,
			tests: [
				testMapperReturns_burn_works_with_change,
				testMapperReturns_burn_works_without_change,

				testMapperReturns___Unknown_Token___error_when_no_token_definition_particle,
				testMapperReturns___Insufficient_Balance___error_when_no_transferrable_tokens_particles,
				testMapperReturns___Insufficient_Balance___error_when_not_enough_transferrable_tokens_particles,
				testMapperReturns___Wrong_Sender___error_when_addressOfActiveAccount_is_someone_elses,
				testMapperReturns___Insufficient_Balance___error_when_some_of_transferrable_tokens_particles_belongs_to_someone_else,

				// Burn specific
				testMapperReturns___NotPermissionToBurn___error_when_trying_to_burn_MutableSupplyTokenDefinition_without_permission,
			],
		})
	})
})
