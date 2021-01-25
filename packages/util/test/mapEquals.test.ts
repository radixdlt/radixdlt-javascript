import { mapEquals } from '../src/mapEquals'

describe('Map Equals', () => {
	it('can check for equality of non empty types', () => {
		const lhs: ReadonlyMap<string, number> = new Map([['foo', 1]])

		const rhs: ReadonlyMap<string, number> = new Map([['foo', 1]])

		expect(mapEquals(lhs, rhs)).toBe(true)
	})

	it('can check for equality of empty types', () => {
		const lhs: ReadonlyMap<string, number> = new Map([])
		const rhs: ReadonlyMap<string, number> = new Map([])

		expect(mapEquals(lhs, rhs)).toBe(true)
	})

	it('can check for inequality of non matching valyes', () => {
		const lhs: ReadonlyMap<string, number> = new Map([['foo', 1]])

		const rhs: ReadonlyMap<string, number> = new Map([['foo', 2]])

		expect(mapEquals(lhs, rhs)).toBe(false)
	})

	it('can check for inequality of overlapping valyes', () => {
		const lhs: ReadonlyMap<string, number> = new Map([['foo', 1]])

		const rhs: ReadonlyMap<string, number> = new Map([
			['foo', 1],
			['buz', 2],
		])

		expect(mapEquals(lhs, rhs)).toBe(false)
	})
})
