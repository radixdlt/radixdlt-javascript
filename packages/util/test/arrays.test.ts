import { isNumberArray } from '../src/arrays'

describe('arrays', () => {
	it('should be able to type check unknown against number array', () => {
		expect(isNumberArray([1, 2, 3])).toBe(true)
		expect(isNumberArray(['foo', 'bar'])).toBe(false)
		expect(isNumberArray([1, 'bar'])).toBe(false)
		expect(isNumberArray('just a string')).toBe(false)
	})

	it('can break in reduce', () => {
		const array = ['9', '91', '95', '96', '99']
		const result = array.reduceBreak({
			initialValue: '',
			accumulator: (acc, cur) => acc += cur,
			breakOn: (a, c, i) => i === 2
		})
		expect(result).toBe('99195')
		expect(array).toStrictEqual(array) // should be unnchanged
	})
})
