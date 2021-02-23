/* eslint-disable */
import { TokensActionBase } from '@radixdlt/actions'
import { AddressT } from '@radixdlt/crypto'
import {
	AnyUpParticle,
	Spin,
	TokenDefinitionParticleBase,
	TokenDefinitionParticleInput,
	tokenOwnerOnly,
	TokenParticle,
	tokenPermissionsAll,
	TransferrableTokensParticle,
	upParticle,
	UpParticle,
} from '@radixdlt/atom'
import { Amount, maxAmount } from '@radixdlt/primitives'
import { UInt256 } from '@radixdlt/uint256'
import { toAddress } from '../../atom/test/helpers/utility'
import { two, three, one, four, five } from '@radixdlt/primitives/src/amount'
import { ActionToParticleGroupsMapper } from '../src/toAtom/_types'
import {
	FixedSupplyTokenDefinitionParticle,
	MutableSupplyTokenDefinitionParticle,
	ResourceIdentifier,
	TransferrableTokensParticleT,
} from '@radixdlt/atom/src/_index'

export type TestCaseReturn = ReturnType<typeof it>

export type TestVector<T extends TokenDefinitionParticleBase> = Readonly<{
	mapper: ActionToParticleGroupsMapper
	makeAction: (amount: number, actor?: AddressT) => TokensActionBase
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
export const rri = ResourceIdentifier.fromAddressAndName({
	address: alice,
	name: symbol,
})

const name = 'Foobar Coin'

const tokenDefInput = <TokenDefinitionParticleInput>{
	symbol,
	name,
	address: alice,
	granularity: one,
}

export const fixedSupTokDefParticle = FixedSupplyTokenDefinitionParticle.create({
	...tokenDefInput,
	supply: maxAmount,
})._unsafeUnwrap()

export const mutableSupplyTokenDefinitionParticleAllCanMutate = MutableSupplyTokenDefinitionParticle.create(
	{
		...tokenDefInput,
		permissions: tokenPermissionsAll,
	},
)._unsafeUnwrap()

export const mutableSupplyTokenDefinitionParticleOnlyAliceCanMutate = MutableSupplyTokenDefinitionParticle.create(
	{
		...tokenDefInput,
		permissions: tokenOwnerOnly,
	},
)._unsafeUnwrap()

export const upTTP = (
	amount: number,
	tokenDefinitionParticle: TokenDefinitionParticleBase,
	owner?: AddressT,
): UpParticle<TransferrableTokensParticleT> => {
	return upParticle(
		TransferrableTokensParticle.create({
			granularity: tokenDefinitionParticle.granularity,
			resourceIdentifier: tokenDefinitionParticle.resourceIdentifier,
			address: owner ?? alice,
			amount: Amount.inSmallestDenomination(UInt256.valueOf(amount)),
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
					`Unknown token with identifier: '${action.resourceIdentifier.toString()}'`,
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

export const testMapperReturns___works_with_change = <
	T extends TokenDefinitionParticleBase
>(
	validateMigratedParticle: (migratedParticle: TokenParticle) => void,
	validateOutputParticle: (outputParticle: TokenParticle) => void,
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

		const sp0 = spunParticles[0]
		expect(sp0.spin).toBe(Spin.DOWN)
		const p0 = sp0.particle as TransferrableTokensParticleT
		expect(p0.amount.equals(two)).toBe(true)

		const sp1 = spunParticles[1]
		expect(sp1.spin).toBe(Spin.DOWN)
		const p1 = sp1.particle as TransferrableTokensParticleT
		expect(p1.amount.equals(three)).toBe(true)

		// Change back to Alice
		const sp2 = spunParticles[2]
		expect(sp2.spin).toBe(Spin.UP)
		const p2 = sp2.particle as TokenParticle
		expect(p2.amount.equals(one)).toBe(true)
		validateMigratedParticle(p2)

		const sp3 = spunParticles[3]
		expect(sp3.spin).toBe(Spin.UP)
		const p3 = sp3.particle as TokenParticle
		expect(p3.amount.equals(four)).toBe(true)
		validateOutputParticle(p3)
	})

export const testMapperReturns___works_without_change = <
	T extends TokenDefinitionParticleBase
>(
	validateOutputParticle: (outputParticle: TokenParticle) => void,
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

		const sp0 = spunParticles[0]
		expect(sp0.spin).toBe(Spin.DOWN)
		const p0 = sp0.particle as TransferrableTokensParticleT
		expect(p0.amount.equals(two)).toBe(true)

		const sp1 = spunParticles[1]
		expect(sp1.spin).toBe(Spin.DOWN)
		const p1 = sp1.particle as TransferrableTokensParticleT
		expect(p1.amount.equals(three)).toBe(true)

		const sp2 = spunParticles[2]
		expect(sp2.spin).toBe(Spin.UP)
		const p2 = sp2.particle as TokenParticle
		expect(p2.amount.equals(five)).toBe(true)
		validateOutputParticle(p2)
	})
