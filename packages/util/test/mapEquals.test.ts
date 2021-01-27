import { mapEquals } from '../src/mapEquals'

describe('Map Equals', () => {
	it('can check for equality of non empty types', () => {
		const lhs = { foo: 1 }
		const rhs = { foo: 1 }

		expect(mapEquals(lhs, rhs)).toBe(true)
	})

	it('can check for equality of empty types', () => {
		const lhs = {}
		const rhs = {}

		expect(mapEquals(lhs, rhs)).toBe(true)
	})

	it('can check for inequality of non matching values', () => {
		const lhs = { foo: 1 }
		const rhs = { foo: 2 }

		expect(mapEquals(lhs, rhs)).toBe(false)
	})

	it('can check for inequality of overlapping values', () => {
		const lhs = { foo: 1 }
		const rhs = { foo: 1, buz: 2 }

		expect(mapEquals(lhs, rhs)).toBe(false)
	})
})
