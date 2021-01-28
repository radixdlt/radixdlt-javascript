export const isNumberArray = (test: unknown): boolean =>
	Array.isArray(test) && test.every((value) => typeof value === 'number')

export {}
/* eslint-disable */
declare global {
	interface Array<T> {
		reduceBreak<T, U>(
			input: Readonly<{
				initialValue: U
				accumulator: (accumulated: U, currentElement: T) => U
				breakOn?: (accumulated: U, currentElement: T, index: number) => boolean
			}>,
		): U
	}
}

if (!Array.prototype.reduceBreak) {
	Array.prototype.reduceBreak = function <T, U>(
		input: Readonly<{
			initialValue: U
			accumulator: (accumulated: U, currentElement: T) => U
			breakOn?: (accumulated: U, currentElement: T, index: number) => boolean
		}>,
	): U {
		const breakOn = input.breakOn ?? ((a, c, i) => false)

		const reducer = (
			accumulated: U,
			currentElement: T,
			index: number,
			array: T[],
		): U => {
			if (breakOn(accumulated, currentElement, index)) {
				// trick to 'break', see: https://stackoverflow.com/a/47441371/1311272
				// eslint-disable-next-line functional/immutable-data
				array.splice(1)
			}
			return input.accumulator(accumulated, currentElement)
		}

		// eslint-disable-next-line functional/no-this-expression
		return this.slice(0).reduce(reducer, input.initialValue)
	}
}

