/* eslint-disable */
export const mapEquals = <K, V>(
	lhs: ReadonlyMap<K, V>,
	rhs: ReadonlyMap<K, V>,
): boolean => {
	if (lhs.size !== rhs.size) return false
	let testVal

	for (const [key, val] of lhs) {
		testVal = rhs.get(key)
		// in cases of an undefined value, make sure the key
		// actually exists on the object so there are no false positives
		if (testVal !== val || (testVal === undefined && !rhs.has(key))) {
			return false
		}
	}

	return true
}
/* eslint-enable */
