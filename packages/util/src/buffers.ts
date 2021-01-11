// eslint-disable-next-line max-params
export const buffersEquals = (lhs: Buffer, rhs: Buffer): boolean => {
	return Buffer.compare(lhs, rhs) === 0
}
