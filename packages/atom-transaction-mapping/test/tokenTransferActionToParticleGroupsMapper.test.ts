import { tokenTransferActionToParticleGroupsMapper } from '../src/toAtom/tokenTransferActionToParticleGroupsMapper'
import { TransferTokensAction, transferTokensAction } from '@radixdlt/actions'
import {
	isTransferrableTokensParticle,
	TokenParticle,
	TokenDefinitionParticleBase,
} from '@radixdlt/atom'
import { amountInSmallestDenomination } from '@radixdlt/primitives'
import {
	testMapperReturns___Unknown_Token___error_when_no_token_definition_particle,
	testMapperReturns___Insufficient_Balance___error_when_no_transferrable_tokens_particles,
	testMapperReturns___Insufficient_Balance___error_when_not_enough_transferrable_tokens_particles,
	testMapperReturns___Wrong_Sender___error_when_addressOfActiveAccount_is_someone_elses,
	testMapperReturns___Insufficient_Balance___error_when_some_of_transferrable_tokens_particles_belongs_to_someone_else,
	testMapperReturns___works_with_change,
	testMapperReturns___works_without_change,
	bob,
	rri,
	alice,
	fixedSupTokDefParticle,
	TestCase,
	TestVector,
	mutableSupplyTokenDefinitionParticleAllCanMutate,
} from './consumeTokensActionToParticleGroupsMapperBase'
import { Address } from '@radixdlt/account'
import { UInt256 } from '@radixdlt/uint256'

describe('TokenTransferActionToParticleGroupsMapper', () => {
	const mapper = tokenTransferActionToParticleGroupsMapper()

	const makeTransferAction = (
		amount: number = 1337,
		actor?: Address,
	): TransferTokensAction => {
		return transferTokensAction({
			to: bob,
			from: actor ?? alice,
			amount: amountInSmallestDenomination(UInt256.valueOf(amount)),
			resourceIdentifier: rri,
		})
	}

	const testTransferActionWithToken = <T extends TokenDefinitionParticleBase>(
		tokenDefinitionParticle: T,
	): void => {
		const tests: TestCase<T>[] = [
			testMapperReturns___works_with_change.bind(
				null,
				(migratedParticle: TokenParticle): void => {
					if (!isTransferrableTokensParticle(migratedParticle))
						throw new Error(`Expected output particle to be TTP`)
					expect(migratedParticle.address.equals(alice)).toBe(true)
				},

				(outputParticle: TokenParticle): void => {
					if (!isTransferrableTokensParticle(outputParticle))
						throw new Error(`Expected output particle to be TTP`)
					expect(outputParticle.address.equals(bob)).toBe(true)
				},
			),

			testMapperReturns___works_without_change.bind(
				null,
				(outputParticle: TokenParticle): void => {
					if (!isTransferrableTokensParticle(outputParticle))
						throw new Error(`Expected output particle to be TTP`)
					expect(outputParticle.address.equals(bob)).toBe(true)
				},
			),

			testMapperReturns___Unknown_Token___error_when_no_token_definition_particle,
			testMapperReturns___Insufficient_Balance___error_when_no_transferrable_tokens_particles,
			testMapperReturns___Insufficient_Balance___error_when_not_enough_transferrable_tokens_particles,
			testMapperReturns___Wrong_Sender___error_when_addressOfActiveAccount_is_someone_elses,
			testMapperReturns___Insufficient_Balance___error_when_some_of_transferrable_tokens_particles_belongs_to_someone_else,
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
