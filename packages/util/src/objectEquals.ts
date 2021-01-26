// @ts-nocheck
/* eslint-disable */
export const objectEquals = <K extends symbol, V>(
	lhs: Readonly<{ [key in K]: V }>,
	rhs: Readonly<{ [key in K]: V }>,
): boolean => {
	if (Object.keys(lhs).length !== Object.keys(rhs).length) return false
	return (
		Object.keys(lhs).filter(
			(key) =>
				rhs[key] !== lhs[key] ||
				(rhs[key] === undefined && !(key in rhs)),
		).length === 0
	)
}
/* eslint-enable */
