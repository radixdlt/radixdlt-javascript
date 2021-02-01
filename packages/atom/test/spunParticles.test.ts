import { spunParticles } from '../src/particles/spunParticles'

import {
	ResourceIdentifierParticleType,
	UnallocatedTokensParticleType,
	TransferrableTokensParticleType,
} from '../src/particles/meta/radixParticleTypes'
import {
	exactlyContainParticles,
	spunParticles_,
	rriParticle0Down,
	rriParticle0Up,
	rriParticle1Down,
	rriParticle1Up,
	ttParticle0Down,
	ttParticle0Up,
	ttParticle1Down,
	ttParticle1Up,
	uatParticle0Down,
	uatParticle0Up,
	uatParticle1Down,
	uatParticle1Up,
} from './helpers/particles'
import { AnySpunParticle, Spin } from '../src/particles/_types'

describe('SpunParticles', () => {
	it('removes duplicates', () => {
		const duplicates: AnySpunParticle[] = [
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
