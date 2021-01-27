/* eslint-disable */
export const mapEquals = <K extends symbol, V>(
	lhs: Readonly<{ [key in K]: V }>,
	rhs: Readonly<{ [key in K]: V }>,
): boolean => {
	if (Object.keys(lhs).length !== Object.keys(rhs).length) return false

	let testVal: V

	for (const key of Object.keys(lhs)) {
		// @ts-ignore
		testVal = rhs[key]
		// in cases of an undefined value, make sure the key
		// actually exists on the object so there are no false positives
		// @ts-ignore
		if (testVal !== lhs[key] || (testVal === undefined && !(key in rhs))) {
			return false
		}
	}

	return true
}
/* eslint-enable */
