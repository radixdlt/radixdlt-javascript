import { tokenTransferActionToParticleGroupsMapper } from '../src/tokenTransferActionToParticleGroupsMapper'
import { TokensActionBase, TransferTokensAction, transferTokensAction, UserAction } from '@radixdlt/actions'
import { Address, addressFromBase58String } from '@radixdlt/crypto'
import {
	AnyUpParticle,
	fixedSupplyTokenDefinitionParticle,
	resourceIdentifierFromAddressAndName,
	Spin,
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
import { ActionToParticleGroupsMapper } from '../src/_types'
import { TokenDefinitionParticleBase } from '@radixdlt/atom/src/particles/_types'

type TestCaseReturn = ReturnType<typeof it>

describe('TokenTransferActionToParticleGroupsMapper', () => {
	const mapper = tokenTransferActionToParticleGroupsMapper()

	const alice = toAddress(
		'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
	)
	const bob = toAddress(
		'9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
	)

	const carol = toAddress(
		'9S8sKfN3wGyJdfyu9RwWvGKtZqq3R1NaxwT63VXi5dEZ6dUJXLyR',
	)

	const dan = toAddress(
		'9SBFdPAkvquf9XX82D2Z9DzL2WdmNQGcrxFUnKpVytpkMjZWD9Rb',
	)

	const symbol = 'FOOBAR'
	const rri = resourceIdentifierFromAddressAndName({
		address: alice,
		name: symbol,
	})

	const name = 'Foobar Coin'

	const tokenDefInput = <TokenDefinitionParticleInput>{
		symbol,
		name,
		address: alice,
	}

	const fixedSupTokDefParticle = fixedSupplyTokenDefinitionParticle({
		...tokenDefInput,
		supply: amountFromUInt256({
			magnitude: UInt256.valueOf(21_000_000),
			denomination: Denomination.Whole,
		})._unsafeUnwrap(),
	})._unsafeUnwrap()

	const makeTransferAction = (amount: number = 1337): TransferTokensAction => {
		return transferTokensAction({
			to: bob,
			from: alice,
			amount: positiveAmountFromUnsafe(amount)._unsafeUnwrap(),
			resourceIdentifier: rri,
		})
	}

	const upTTP = (
		amount: number,
		owner?: Address,
	): UpParticle<TransferrableTokensParticle> => {
		return upParticle(
			transferrableTokensParticle({
				granularity: fixedSupTokDefParticle.granularity,
				tokenDefinitionReference:
					fixedSupTokDefParticle.resourceIdentifier,
				address: owner ?? alice,
				amount: positiveAmountFromUnsafe(amount)._unsafeUnwrap(),
			})._unsafeUnwrap(),
		)
	}


	const testMapperReturns___Unknown_Token___error_when_no_token_definition_particle = (input: Readonly<{ 
		mapper: ActionToParticleGroupsMapper
		action: TokensActionBase
	}>): TestCaseReturn => {
		const mapper = input.mapper
		const action = input.action
		expect(mapper.actionType).toBe(action.actionType)

		it(`should fail with error 'Unknown Token' when no TokenDefinitionParticle present`, () => {

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
	}
	testMapperReturns___Unknown_Token___error_when_no_token_definition_particle({
		mapper,
		action: makeTransferAction()
	})

	const testMapperReturns___Insufficient_Balance___error_when_no_transferrable_tokens_particles = <T extends TokenDefinitionParticleBase>(input: Readonly<{ 
		mapper: ActionToParticleGroupsMapper
		action: TokensActionBase
		tokenDefinitionParticle: T
	}>): TestCaseReturn => {
		const mapper = input.mapper
		const action = input.action
		expect(mapper.actionType).toBe(action.actionType)

		it(`should fail with error 'Insufficient Balance' when FixedSupplyTokenDefinitionParticle but no TransferrableTokensParticle(s) present.`, () => {

			const spunUpParticles: AnyUpParticle[] = [
				upParticle(input.tokenDefinitionParticle).eraseToAnyUp(),
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
	}
	testMapperReturns___Insufficient_Balance___error_when_no_transferrable_tokens_particles({
		mapper,
		action: makeTransferAction(),
		tokenDefinitionParticle: fixedSupTokDefParticle
	})

	const testMapperReturns___Insufficient_Balance___error_when_not_enough_transferrable_tokens_particles = <T extends TokenDefinitionParticleBase>(input: Readonly<{ 
		mapper: ActionToParticleGroupsMapper
		makeAction: (amount: number) => TokensActionBase
		tokenDefinitionParticle: T
	}>): void => {
		it(`should fail with error 'Insufficient Balance' when not enough TransferrableTokensParticles present.`, () => {
			const mapper = input.mapper
			const action = input.makeAction(4)
			expect(mapper.actionType).toBe(action.actionType)

			const spunUpParticles: AnyUpParticle[] = [
				upParticle(input.tokenDefinitionParticle),
				upTTP(3), // 3 is less than 4.
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
	}
	testMapperReturns___Insufficient_Balance___error_when_not_enough_transferrable_tokens_particles({
		mapper,
		makeAction: makeTransferAction,
		tokenDefinitionParticle: fixedSupTokDefParticle
	})


	const testMapperReturns___Wrong_Sender___error_when_addressOfActiveAccount_is_someone_elses = <T extends TokenDefinitionParticleBase>(input: Readonly<{ 
		mapper: ActionToParticleGroupsMapper
		action: TokensActionBase
		tokenDefinitionParticle: T
	}>): void => {
		const mapper = input.mapper
		const action = input.action
		expect(mapper.actionType).toBe(action.actionType)

		it(`should fail with error 'Wrong sender/signer' when addressOfActiveAcount is someone elses.`, () => {
			expect(alice.equals(carol)).toBe(false)

			const spunUpParticles: AnyUpParticle[] = [
				upParticle(fixedSupTokDefParticle),
				upTTP(2),
				upTTP(3),
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
	}
	testMapperReturns___Wrong_Sender___error_when_addressOfActiveAccount_is_someone_elses({
		mapper,
		action: makeTransferAction(),
		tokenDefinitionParticle: fixedSupTokDefParticle
	})

	const testMapperReturns___Insufficient_Balance___error_when_some_of_transferrable_tokens_particles_belongs_to_someone_else = <T extends TokenDefinitionParticleBase>(input: Readonly<{ 
		mapper: ActionToParticleGroupsMapper
		makeAction: (amount: number) => TokensActionBase
		tokenDefinitionParticle: T
	}>): TestCaseReturn => {
	
		it(`should fail with error 'Insufficient Balance' when some of the TransferrableTokensParticles belong to someone else.`, () => {
			const mapper = input.mapper
			const action = input.makeAction(4)
			expect(mapper.actionType).toBe(action.actionType)

			expect(alice.equals(carol)).toBe(false)

			const spunUpParticles: AnyUpParticle[] = [
				upParticle(fixedSupTokDefParticle),
				upTTP(2, dan), // belongs to Dan instead of Alkice.
				upTTP(3),
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

	}
	testMapperReturns___Insufficient_Balance___error_when_some_of_transferrable_tokens_particles_belongs_to_someone_else({
		mapper,
		makeAction: makeTransferAction,
		tokenDefinitionParticle: fixedSupTokDefParticle
	})

	const testMapperReturns___works_with_change = <T extends TokenDefinitionParticleBase>(input: Readonly<{ 
		mapper: ActionToParticleGroupsMapper
		makeAction: (amount: number) => TokensActionBase
		tokenDefinitionParticle: T
	}>): TestCaseReturn => {

		it(`should work with a FixedSupplyTokenDefinitionParticle and some TransferrableTokensParticles with change back.`, () => {
			const mapper = input.mapper
			const action = input.makeAction(4)
			expect(mapper.actionType).toBe(action.actionType)

			const spunUpParticles: AnyUpParticle[] = [
				upParticle(fixedSupTokDefParticle),
				upTTP(2),
				upTTP(3),
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

	}
	testMapperReturns___works_with_change({
		mapper,
		makeAction: makeTransferAction,
		tokenDefinitionParticle: fixedSupTokDefParticle
	})







	const testMapperReturns___works_without_change = <T extends TokenDefinitionParticleBase>(input: Readonly<{ 
		mapper: ActionToParticleGroupsMapper
		makeAction: (amount: number) => TokensActionBase
		tokenDefinitionParticle: T
	}>): TestCaseReturn => {

		it(`should work with a FixedSupplyTokenDefinitionParticle and some TransferrableTokensParticles with no change back.`, () => {
			const mapper = input.mapper
			const action = input.makeAction(5)
			expect(mapper.actionType).toBe(action.actionType)

			const spunUpParticles: AnyUpParticle[] = [
				upParticle(fixedSupTokDefParticle),
				upTTP(2),
				upTTP(3),
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

	}
	testMapperReturns___works_without_change({
		mapper,
		makeAction: makeTransferAction,
		tokenDefinitionParticle: fixedSupTokDefParticle
	})

})
