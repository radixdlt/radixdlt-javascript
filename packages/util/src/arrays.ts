export const isNumberArray = (test: unknown): boolean =>
	Array.isArray(test) && test.every((value) => typeof value === 'number')

export const nonNullNonUndefined = <Element>(
	value: Element | null | undefined,
): value is Element => {
	return value !== null && value !== undefined
}
