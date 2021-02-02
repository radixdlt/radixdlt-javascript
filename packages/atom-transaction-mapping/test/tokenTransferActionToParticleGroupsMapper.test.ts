import { tokenTransferActionToParticleGroupsMapper } from '../src/tokenTransferActionToParticleGroupsMapper'
import { TransferTokensAction, transferTokensAction } from '@radixdlt/actions'
import { Address } from '@radixdlt/crypto'
import {
	fixedSupplyTokenDefinitionParticle,
	resourceIdentifierFromAddressAndName,
	TokenDefinitionParticleInput,
	transferrableTokensParticle,
	TransferrableTokensParticle,
	upParticle,
	UpParticle,
} from '@radixdlt/atom'
import {
	amountFromUInt256,
	Denomination,
	positiveAmountFromUnsafe,
} from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'
import { toAddress } from '../../atom/test/helpers/utility'
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
} from './consumeTokensActionToParticleGroupsMapperBase'

describe('TokenTransferActionToParticleGroupsMapper', () => {
	const mapper = tokenTransferActionToParticleGroupsMapper()

	const makeTransferAction = (
		amount: number = 1337,
	): TransferTokensAction => {
		return transferTokensAction({
			to: bob,
			from: alice,
			amount: positiveAmountFromUnsafe(amount)._unsafeUnwrap(),
			resourceIdentifier: rri,
		})
	}

	testMapperReturns___Unknown_Token___error_when_no_token_definition_particle(
		{
			mapper,
			makeAction: makeTransferAction,
		},
	)

	testMapperReturns___Insufficient_Balance___error_when_no_transferrable_tokens_particles(
		{
			mapper,
			makeAction: makeTransferAction,
			tokenDefinitionParticle: fixedSupTokDefParticle,
		},
	)

	testMapperReturns___Insufficient_Balance___error_when_not_enough_transferrable_tokens_particles(
		{
			mapper,
			makeAction: makeTransferAction,
			tokenDefinitionParticle: fixedSupTokDefParticle,
		},
	)

	testMapperReturns___Wrong_Sender___error_when_addressOfActiveAccount_is_someone_elses(
		{
			mapper,
			makeAction: makeTransferAction,
			tokenDefinitionParticle: fixedSupTokDefParticle,
		},
	)

	testMapperReturns___Insufficient_Balance___error_when_some_of_transferrable_tokens_particles_belongs_to_someone_else(
		{
			mapper,
			makeAction: makeTransferAction,
			tokenDefinitionParticle: fixedSupTokDefParticle,
		},
	)

	testMapperReturns___works_with_change({
		mapper,
		makeAction: makeTransferAction,
		tokenDefinitionParticle: fixedSupTokDefParticle,
	})

	testMapperReturns___works_without_change({
		mapper,
		makeAction: makeTransferAction,
		tokenDefinitionParticle: fixedSupTokDefParticle,
	})
})
