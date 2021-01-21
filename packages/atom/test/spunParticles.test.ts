import { spunParticles } from '../src/spunParticles'
import { downParticle, upParticle } from '../src/spunParticle'
import { resourceIdentifierFromString } from '../src/resourceIdentifier'
import { resourceIdentifierParticle } from '../src/resourceIdentifierParticle'
import {
	ResourceIdentifier,
	Spin,
	SpunParticleLike,
	UnallocatedTokensParticle,
} from '../src/_types'
import {
	transferrableTokensParticleFromUnsafe,
	unallocatedTokensParticleFromUnsafe,
} from './utility'
import {
	ResourceIdentifierParticleType,
	UnallocatedTokensParticleType,
	TransferrableTokensParticleType,
} from '../src/radixParticleTypes'
import { TransferrableTokensParticle } from '../src/_types'
import {
	ResourceIdentifierParticle,
	SpunParticle,
	SpunParticles,
} from '../dist/_types'

const makeUATParticle = (rri: ResourceIdentifier): UnallocatedTokensParticle =>
	unallocatedTokensParticleFromUnsafe({
		tokenDefinitionReference: rri,
		granularity: 3,
		amount: 9,
	})._unsafeUnwrap()

const makeTTParticle = (rri: ResourceIdentifier): TransferrableTokensParticle =>
	transferrableTokensParticleFromUnsafe({
		address: '9S9LHeQNFpNJYqLtTJeAbos1LCC5Q7HBiGwPf2oju3NRq5MBKAGt',
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
const ttParticle0 = makeTTParticle(rri0)
const ttParticle1 = makeTTParticle(rri1)

const rriParticle0Up = upParticle(rriParticle0)
const rriParticle1Up = upParticle(rriParticle1)
const rriParticle0Down = downParticle(rriParticle0)
const rriParticle1Down = downParticle(rriParticle1)

const uatParticle0Up = upParticle(uatParticle0)
const uatParticle1Up = upParticle(uatParticle1)
const uatParticle0Down = downParticle(uatParticle0)
const uatParticle1Down = downParticle(uatParticle1)

const ttParticle0Up = upParticle(ttParticle0)
const ttParticle1Up = upParticle(ttParticle1)
const ttParticle0Down = downParticle(ttParticle0)
const ttParticle1Down = downParticle(ttParticle1)

const spunParticles_ = spunParticles([
	rriParticle0Up,
	rriParticle1Up,
	rriParticle0Down,
	rriParticle1Down,
	uatParticle0Up,
	uatParticle1Up,
	uatParticle0Down,
	uatParticle1Down,
	ttParticle0Up,
	ttParticle1Up,
	ttParticle0Down,
	ttParticle1Down,
])

const exactlyContainParticles = (
	input: Readonly<{
		actual: SpunParticleLike[]
		expected: SpunParticleLike[]
	}>,
): boolean => {
	const formIntersection = (
		lhs: SpunParticleLike[],
		rhs: SpunParticleLike[],
	): SpunParticleLike[] =>
		[...lhs].filter((x) => rhs.find((sp) => sp.equals(x)) !== undefined)

	const formDifference = (
		lhs: SpunParticleLike[],
		rhs: SpunParticleLike[],
	): SpunParticleLike[] =>
		[...lhs].filter((x) => rhs.find((sp) => sp.equals(x)) === undefined)

	return (
		formDifference(input.actual, input.expected).length === 0 &&
		formIntersection(input.actual, input.expected).length ===
			input.expected.length
	)
}

describe('SpunParticles', () => {
	it('removes duplicates', () => {
		const duplicates: SpunParticleLike[] = [
			rriParticle0Up,
			rriParticle0Up,
			rriParticle1Up,
		]
		const spunParticlesRemovingDuplicates = spunParticles(duplicates)
		expect(spunParticlesRemovingDuplicates.spunParticles).toStrictEqual([
			rriParticle0Up,
			rriParticle1Up,
		])
	})

	describe('anySpunParticles query', () => {
		it('when querying anySpunParticles without spin or type, no spunParticle is ignored.', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.anySpunParticlesOfTypeWithSpin({}),
					expected: [
						rriParticle0Up,
						rriParticle1Up,
						rriParticle0Down,
						rriParticle1Down,
						uatParticle0Up,
						uatParticle1Up,
						uatParticle0Down,
						uatParticle1Down,
						ttParticle0Up,
						ttParticle1Up,
						ttParticle0Down,
						ttParticle1Down,
					],
				}),
			).toBe(true)
		})

		it('can query anySpunParticles by spin=UP but skip type', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.anySpunParticlesOfTypeWithSpin({
						spin: Spin.UP,
					}),
					expected: [
						rriParticle0Up,
						rriParticle1Up,
						uatParticle0Up,
						uatParticle1Up,
						ttParticle0Up,
						ttParticle1Up,
					],
				}),
			).toBe(true)
		})

		it('can query anySpunParticles by spin=DOWN but skip type', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.anySpunParticlesOfTypeWithSpin({
						spin: Spin.DOWN,
					}),
					expected: [
						rriParticle0Down,
						rriParticle1Down,
						uatParticle0Down,
						uatParticle1Down,
						ttParticle0Down,
						ttParticle1Down,
					],
				}),
			).toBe(true)
		})

		it('can query anySpunParticles only by type=ResourceIdentifierParticle', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.anySpunParticlesOfTypeWithSpin({
						particleTypes: [ResourceIdentifierParticleType],
					}),
					expected: [
						rriParticle0Up,
						rriParticle1Up,
						rriParticle0Down,
						rriParticle1Down,
					],
				}),
			).toBe(true)
		})

		it('can query anySpunParticles only by type=ResourceIdentifierParticle OR UnallocatedTokensParticle', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.anySpunParticlesOfTypeWithSpin({
						particleTypes: [
							ResourceIdentifierParticleType,
							UnallocatedTokensParticleType,
						],
					}),
					expected: [
						rriParticle0Up,
						rriParticle1Up,
						rriParticle0Down,
						rriParticle1Down,
						uatParticle0Up,
						uatParticle1Up,
						uatParticle0Down,
						uatParticle1Down,
					],
				}),
			).toBe(true)
		})

		it('can query anySpunParticles only by type=UnallocatedTokensParticle OR TransferrableTokensParticle', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.anySpunParticlesOfTypeWithSpin({
						particleTypes: [
							UnallocatedTokensParticleType,
							TransferrableTokensParticleType,
						],
					}),
					expected: [
						uatParticle0Up,
						uatParticle1Up,
						uatParticle0Down,
						uatParticle1Down,
						ttParticle0Up,
						ttParticle1Up,
						ttParticle0Down,
						ttParticle1Down,
					],
				}),
			).toBe(true)
		})

		it('can query anySpunParticles only by type=ResourceIdentifierParticle OR TransferrableTokensParticle', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.anySpunParticlesOfTypeWithSpin({
						particleTypes: [
							ResourceIdentifierParticleType,
							TransferrableTokensParticleType,
						],
					}),
					expected: [
						rriParticle0Up,
						rriParticle1Up,
						rriParticle0Down,
						rriParticle1Down,
						ttParticle0Up,
						ttParticle1Up,
						ttParticle0Down,
						ttParticle1Down,
					],
				}),
			).toBe(true)
		})

		it('can query anySpunParticles only by type=ResourceIdentifierParticle OR UnallocatedTokensParticle OR TransferrableTokensParticle', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.anySpunParticlesOfTypeWithSpin({
						particleTypes: [
							ResourceIdentifierParticleType,
							UnallocatedTokensParticleType,
							TransferrableTokensParticleType,
						],
					}),
					expected: [
						rriParticle0Up,
						rriParticle1Up,
						rriParticle0Down,
						rriParticle1Down,
						uatParticle0Up,
						uatParticle1Up,
						uatParticle0Down,
						uatParticle1Down,
						ttParticle0Up,
						ttParticle1Up,
						ttParticle0Down,
						ttParticle1Down,
					],
				}),
			).toBe(true)
		})

		it('can query anySpunParticles by spin=UP and by type=ResourceIdentifierParticle', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.anySpunParticlesOfTypeWithSpin({
						spin: Spin.UP,
						particleTypes: [ResourceIdentifierParticleType],
					}),
					expected: [rriParticle0Up, rriParticle1Up],
				}),
			).toBe(true)
		})

		it('can query anySpunParticles by spin=UP and by type=ResourceIdentifierParticle OR UnallocatedTokensParticle', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.anySpunParticlesOfTypeWithSpin({
						spin: Spin.UP,
						particleTypes: [
							ResourceIdentifierParticleType,
							UnallocatedTokensParticleType,
						],
					}),
					expected: [
						rriParticle0Up,
						rriParticle1Up,
						uatParticle0Up,
						uatParticle1Up,
					],
				}),
			).toBe(true)
		})

		it('can query anySpunParticles by spin=UP and by type=UnallocatedTokensParticle OR TransferrableTokensParticle', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.anySpunParticlesOfTypeWithSpin({
						spin: Spin.UP,
						particleTypes: [
							UnallocatedTokensParticleType,
							TransferrableTokensParticleType,
						],
					}),
					expected: [
						uatParticle0Up,
						uatParticle1Up,
						ttParticle0Up,
						ttParticle1Up,
					],
				}),
			).toBe(true)
		})

		it('can query anySpunParticles by spin=UP and by type=ResourceIdentifierParticle OR TransferrableTokensParticle', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.anySpunParticlesOfTypeWithSpin({
						spin: Spin.UP,
						particleTypes: [
							ResourceIdentifierParticleType,
							TransferrableTokensParticleType,
						],
					}),
					expected: [
						rriParticle0Up,
						rriParticle1Up,
						ttParticle0Up,
						ttParticle1Up,
					],
				}),
			).toBe(true)
		})

		it('can query anySpunParticles by spin=UP and by type=ResourceIdentifierParticle OR UnallocatedTokensParticle OR TransferrableTokensParticle', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.anySpunParticlesOfTypeWithSpin({
						spin: Spin.UP,
						particleTypes: [
							ResourceIdentifierParticleType,
							UnallocatedTokensParticleType,
							TransferrableTokensParticleType,
						],
					}),
					expected: [
						rriParticle0Up,
						rriParticle1Up,
						uatParticle0Up,
						uatParticle1Up,
						ttParticle0Up,
						ttParticle1Up,
					],
				}),
			).toBe(true)
		})

		it('can query anySpunParticles by spin=DOWN and by type=ResourceIdentifierParticle', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.anySpunParticlesOfTypeWithSpin({
						spin: Spin.DOWN,
						particleTypes: [ResourceIdentifierParticleType],
					}),
					expected: [rriParticle0Down, rriParticle1Down],
				}),
			).toBe(true)
		})

		it('can query anySpunParticles by spin=DOWN and by type=ResourceIdentifierParticle OR UnallocatedTokensParticle', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.anySpunParticlesOfTypeWithSpin({
						spin: Spin.DOWN,
						particleTypes: [
							ResourceIdentifierParticleType,
							UnallocatedTokensParticleType,
						],
					}),
					expected: [
						rriParticle0Down,
						uatParticle0Down,
						rriParticle1Down,
						uatParticle1Down,
					],
				}),
			).toBe(true)
		})

		it('can query anySpunParticles by spin=DOWN and by type=UnallocatedTokensParticle OR TransferrableTokensParticle', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.anySpunParticlesOfTypeWithSpin({
						spin: Spin.DOWN,
						particleTypes: [
							UnallocatedTokensParticleType,
							TransferrableTokensParticleType,
						],
					}),
					expected: [
						uatParticle0Down,
						uatParticle1Down,
						ttParticle0Down,
						ttParticle1Down,
					],
				}),
			).toBe(true)
		})

		it('can query anySpunParticles by spin=DOWN and by type=ResourceIdentifierParticle OR TransferrableTokensParticle', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.anySpunParticlesOfTypeWithSpin({
						spin: Spin.DOWN,
						particleTypes: [
							ResourceIdentifierParticleType,
							TransferrableTokensParticleType,
						],
					}),
					expected: [
						rriParticle0Down,
						rriParticle1Down,
						ttParticle0Down,
						ttParticle1Down,
					],
				}),
			).toBe(true)
		})

		it('can query anySpunParticles by spin=DOWN and by type=ResourceIdentifierParticle OR UnallocatedTokensParticle OR TransferrableTokensParticle', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.anySpunParticlesOfTypeWithSpin({
						spin: Spin.DOWN,
						particleTypes: [
							ResourceIdentifierParticleType,
							UnallocatedTokensParticleType,
							TransferrableTokensParticleType,
						],
					}),
					expected: [
						rriParticle0Down,
						rriParticle1Down,
						uatParticle0Down,
						uatParticle1Down,
						ttParticle0Down,
						ttParticle1Down,
					],
				}),
			).toBe(true)
		})
	})

	describe('query transferrableTokensParticles', () => {
		it('without spin', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.transferrableTokensParticles(),
					expected: [
						ttParticle0Up,
						ttParticle1Up,
						ttParticle0Down,
						ttParticle1Down,
					],
				}),
			).toBe(true)
		})

		it('with spin=UP', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.transferrableTokensParticles(
						Spin.UP,
					),
					expected: [ttParticle0Up, ttParticle1Up],
				}),
			).toBe(true)
		})

		it('without spin=DOWN', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.transferrableTokensParticles(
						Spin.DOWN,
					),
					expected: [ttParticle0Down, ttParticle1Down],
				}),
			).toBe(true)
		})
	})

	describe('query unallocatedTokensParticles', () => {
		it('without spin', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.unallocatedTokensParticles(),
					expected: [
						uatParticle0Up,
						uatParticle1Up,
						uatParticle0Down,
						uatParticle1Down,
					],
				}),
			).toBe(true)
		})

		it('with spin=UP', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.unallocatedTokensParticles(Spin.UP),
					expected: [uatParticle0Up, uatParticle1Up],
				}),
			).toBe(true)
		})

		it('without spin=DOWN', () => {
			expect(
				exactlyContainParticles({
					actual: spunParticles_.unallocatedTokensParticles(
						Spin.DOWN,
					),
					expected: [uatParticle0Down, uatParticle1Down],
				}),
			).toBe(true)
		})
	})
})
