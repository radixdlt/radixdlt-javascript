export const isNumberArray = (test: unknown): boolean =>
	Array.isArray(test) && test.every((value) => typeof value === 'number')
