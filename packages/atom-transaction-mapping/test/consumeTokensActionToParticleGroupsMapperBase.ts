/* eslint-disable */

import { tokenTransferActionToParticleGroupsMapper } from '../src/tokenTransferActionToParticleGroupsMapper'
import {
	TokensActionBase,
	TransferTokensAction,
	transferTokensAction,
} from '@radixdlt/actions'
import { Address } from '@radixdlt/crypto'
import {
	AnyUpParticle,
	fixedSupplyTokenDefinitionParticle,
	mutableSupplyTokenDefinitionParticle,
	resourceIdentifierFromAddressAndName,
	Spin,
	TokenDefinitionParticleBase,
	TokenDefinitionParticleInput,
	tokenOwnerOnly,
	tokenPermissionsAll,
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
import { ActionToParticleGroupsMapper } from '../src/_types'

export type TestCaseReturn = ReturnType<typeof it>

export type TestVector<T extends TokenDefinitionParticleBase> = Readonly<{
	mapper: ActionToParticleGroupsMapper
	makeAction: (amount: number, actor?: Address) => TokensActionBase
	tokenDefinitionParticle: T
}>

export type TestCase<T extends TokenDefinitionParticleBase> = (
	testVector: TestVector<T>,
) => TestCaseReturn

export const alice = toAddress(
	'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
)
export const bob = toAddress(
	'9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
)

const carol = toAddress('9S8sKfN3wGyJdfyu9RwWvGKtZqq3R1NaxwT63VXi5dEZ6dUJXLyR')

const dan = toAddress('9SBFdPAkvquf9XX82D2Z9DzL2WdmNQGcrxFUnKpVytpkMjZWD9Rb')

const symbol = 'FOOBAR'
export const rri = resourceIdentifierFromAddressAndName({
	address: alice,
	name: symbol,
})

const name = 'Foobar Coin'

const tokenDefInput = <TokenDefinitionParticleInput>{
	symbol,
	name,
	address: alice,
}

export const fixedSupTokDefParticle = fixedSupplyTokenDefinitionParticle({
	...tokenDefInput,
	supply: amountFromUInt256({
		magnitude: UInt256.valueOf(21_000_000),
		denomination: Denomination.Whole,
	})._unsafeUnwrap(),
})._unsafeUnwrap()

export const mutableSupplyTokenDefinitionParticleAllCanMutate = mutableSupplyTokenDefinitionParticle(
	{
		...tokenDefInput,
		permissions: tokenPermissionsAll,
	},
)._unsafeUnwrap()

export const mutableSupplyTokenDefinitionParticleOnlyAliceCanMutate = mutableSupplyTokenDefinitionParticle(
	{
		...tokenDefInput,
		permissions: tokenOwnerOnly,
	},
)._unsafeUnwrap()

export const upTTP = (
	amount: number,
	tokenDefinitionParticle: TokenDefinitionParticleBase,
	owner?: Address,
): UpParticle<TransferrableTokensParticle> => {
	return upParticle(
		transferrableTokensParticle({
			granularity: tokenDefinitionParticle.granularity,
			tokenDefinitionReference:
				tokenDefinitionParticle.resourceIdentifier,
			address: owner ?? alice,
			amount: positiveAmountFromUnsafe(amount)._unsafeUnwrap(),
		})._unsafeUnwrap(),
	)
}

export const testMapperReturns___Unknown_Token___error_when_no_token_definition_particle = <
	T extends TokenDefinitionParticleBase
>(
	testVector: TestVector<T>,
): TestCaseReturn =>
	it(`should fail with error 'Unknown Token' when no TokenDefinitionParticle at all present`, () => {
		const mapper = testVector.mapper
		const action = testVector.makeAction(4)
		expect(mapper.actionType).toBe(action.actionType)
		const particleGroupsResult = mapper.particleGroupsFromAction({
			action: action,
			upParticles: [], // EMPTY PARTICLES
			addressOfActiveAccount: alice,
		})

		particleGroupsResult.match(
			() => {
				throw Error('expected error, but got none')
			},
			(f) =>
				expect(f.message).toBe(
					`Unknown token with identifier: '${action.tokenResourceIdentifier.toString()}'`,
				),
		)
	})

export const testMapperReturns___Insufficient_Balance___error_when_no_transferrable_tokens_particles = <
	T extends TokenDefinitionParticleBase
>(
	testVector: TestVector<T>,
): TestCaseReturn =>
	it(`should fail with error 'Insufficient Balance' when ${testVector.tokenDefinitionParticle.radixParticleType} but no TransferrableTokensParticle(s) present.`, () => {
		const mapper = testVector.mapper
		const action = testVector.makeAction(4)
		expect(mapper.actionType).toBe(action.actionType)
		const spunUpParticles: AnyUpParticle[] = [
			upParticle(testVector.tokenDefinitionParticle).eraseToAnyUp(),
			// NO TransferrableTokensParticles to spend
		]

		const particleGroupsResult = mapper.particleGroupsFromAction({
			action: action,
			upParticles: spunUpParticles,
			addressOfActiveAccount: alice,
		})

		particleGroupsResult.match(
			() => {
				throw Error('expected error, but got none')
			},
			(f) => expect(f.message).toBe(`Insufficient balance.`),
		)
	})

export const testMapperReturns___Insufficient_Balance___error_when_not_enough_transferrable_tokens_particles = <
	T extends TokenDefinitionParticleBase
>(
	testVector: TestVector<T>,
): void =>
	it(`should fail with error 'Insufficient Balance' when not enough TransferrableTokensParticles present.`, () => {
		const mapper = testVector.mapper
		const action = testVector.makeAction(4)
		expect(mapper.actionType).toBe(action.actionType)

		const spunUpParticles: AnyUpParticle[] = [
			upParticle(testVector.tokenDefinitionParticle),
			upTTP(3, testVector.tokenDefinitionParticle), // 3 is less than 4.
		].map((p) => p.eraseToAnyUp())

		const particleGroupsResult = mapper.particleGroupsFromAction({
			action: action,
			upParticles: spunUpParticles,
			addressOfActiveAccount: alice,
		})

		particleGroupsResult.match(
			() => {
				throw Error('expected error, but got none')
			},
			(f) => expect(f.message).toBe(`Insufficient balance.`),
		)
	})

export const testMapperReturns___Wrong_Sender___error_when_addressOfActiveAccount_is_someone_elses = <
	T extends TokenDefinitionParticleBase
>(
	testVector: TestVector<T>,
): void =>
	it(`should fail with error 'Wrong sender/signer' when addressOfActiveAcount is someone elses.`, () => {
		const mapper = testVector.mapper
		const action = testVector.makeAction(5)
		expect(mapper.actionType).toBe(action.actionType)

		expect(alice.equals(carol)).toBe(false)

		const spunUpParticles: AnyUpParticle[] = [
			upParticle(testVector.tokenDefinitionParticle),
			upTTP(2, testVector.tokenDefinitionParticle),
			upTTP(3, testVector.tokenDefinitionParticle),
		].map((p) => p.eraseToAnyUp())

		const particleGroupsResult = mapper.particleGroupsFromAction({
			action: action,
			upParticles: spunUpParticles,
			addressOfActiveAccount: carol, // <-- WRONG!
		})

		particleGroupsResult.match(
			() => {
				throw Error('expected error, but got none')
			},
			(f) => expect(f.message).toBe(`Wrong sender/signer`),
		)
	})

export const testMapperReturns___Insufficient_Balance___error_when_some_of_transferrable_tokens_particles_belongs_to_someone_else = <
	T extends TokenDefinitionParticleBase
>(
	testVector: TestVector<T>,
): TestCaseReturn =>
	it(`should fail with error 'Insufficient Balance' when some of the TransferrableTokensParticles belong to someone else.`, () => {
		const mapper = testVector.mapper
		const action = testVector.makeAction(4)
		expect(mapper.actionType).toBe(action.actionType)

		expect(alice.equals(carol)).toBe(false)

		const spunUpParticles: AnyUpParticle[] = [
			upParticle(testVector.tokenDefinitionParticle),
			upTTP(2, testVector.tokenDefinitionParticle, dan), // belongs to Dan instead of Alkice.
			upTTP(3, testVector.tokenDefinitionParticle),
		].map((p) => p.eraseToAnyUp())

		const particleGroupsResult = mapper.particleGroupsFromAction({
			action: action,
			upParticles: spunUpParticles,
			addressOfActiveAccount: alice,
		})

		particleGroupsResult.match(
			() => {
				throw Error('expected error, but got none')
			},
			(f) => expect(f.message).toBe(`Insufficient balance.`),
		)
	})
