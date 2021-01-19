import { spunParticles } from '../src/spunParticles'
import { upParticle, downParticle } from '../src/spunParticle'
import { resourceIdentifierFromString } from '../src/resourceIdentifier'
import { resourceIdentifierParticle } from '../src/resourceIdentifierParticle'
import {
	ResourceIdentifier,
	SpunParticleLike,
	UnallocatedTokensParticle,
} from '../src/_types'
import { unallocatedTokensParticleFromUnsafe } from './utility'

const makeUATParticle = (rri: ResourceIdentifier): UnallocatedTokensParticle =>
	unallocatedTokensParticleFromUnsafe({
		tokenDefinitionReference: rri,
		granularity: 3,
		amount: 9,
	})._unsafeUnwrap()

const rri0 = resourceIdentifierFromString(
	'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/FOO',
)._unsafeUnwrap()

const rri1 = resourceIdentifierFromString(
	'/9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT/BAR',
)._unsafeUnwrap()

const rriParticle0 = resourceIdentifierParticle(rri0)
const rriParticle1 = resourceIdentifierParticle(rri1)

const uatParticle0 = makeUATParticle(rri0)
const uatParticle1 = makeUATParticle(rri1)

const rriParticle0Up = upParticle(rriParticle0)
const rriParticle0Down = downParticle(rriParticle0)

const rriParticle1Up = upParticle(rriParticle1)
const rriParticle1Down = downParticle(rriParticle1)

const uatParticle0Up = upParticle(uatParticle0)
const uatParticle0Down = downParticle(uatParticle0)

const uatParticle1Up = upParticle(uatParticle1)
const uatParticle1Down = downParticle(uatParticle1)

const exactlyContainMembers = <Element>(
	actual: Element[],
	expected: Element[],
): boolean => {
	const formIntersectionS = <T>(lhs: T[], rhs: Set<T>): T[] =>
		[...lhs].filter((x) => rhs.has(x))
	const formIntersectionA = <T>(lhs: T[], rhs: T[]): T[] =>
		formIntersectionS(lhs, new Set(rhs))
	const formDifferencecS = <T>(lhs: T[], rhs: Set<T>): T[] =>
		[...lhs].filter((x) => !rhs.has(x))
	const formDifferenceA = <T>(lhs: T[], rhs: T[]): T[] =>
		formDifferencecS(lhs, new Set(rhs))
	return (
		formDifferenceA(actual, expected).length === 0 &&
		formIntersectionA(actual, expected).length === expected.length
	)
}

const expectExactlyContainMembers = <Element>(
	actual: Element[],
	expected: Element[],
	toBe: boolean = true,
): void => {
	expect(exactlyContainMembers(actual, expected)).toBe(toBe)
}

describe('SpunParticles', () => {
	it('removes duplicates', () => {
		const duplicates: SpunParticleLike[] = [
			rriParticle0Up,
			rriParticle0Up,
			rriParticle1Up,
		]
		const spunParticles_ = spunParticles(duplicates)
		expect(spunParticles_.spunParticles).toStrictEqual([
			rriParticle0Up,
			rriParticle1Up,
		])
	})

	it('can check exactlyContainMembers on arrays', () => {
		expectExactlyContainMembers([1, 2, 3], [1, 2, 3])
		expectExactlyContainMembers([1, 3, 2], [1, 2, 3])
		expectExactlyContainMembers([1, 2, 3], [1, 2], false)
		expectExactlyContainMembers([1, 2, 3], [1, 2, 3, 4], false)
	})

	it('can query particles of type T and spin UP', () => {
		const spunParticles_ = spunParticles([
			rriParticle0Up,
			rriParticle1Up,
			rriParticle0Down,
			uatParticle0Up,
		])
		const upRRIParticles = spunParticles_.upParticlesOfType(
			'ResourceIdentifierParticle',
		)
		expect(
			exactlyContainMembers(upRRIParticles, [
				rriParticle0Up,
				rriParticle1Up,
			]),
		).toBe(true)
	})
})
