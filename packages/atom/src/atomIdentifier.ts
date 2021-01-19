import { AtomIdentifier } from './_types'
import { err, ok, Result } from 'neverthrow'

export const atomIdentifier = (
	bytes: Buffer | string,
): Result<AtomIdentifier, Error> => {
	const buffer = typeof bytes === 'string' ? Buffer.from(bytes, 'hex') : bytes
	const length = 32
	if (buffer.length !== length) {
		return err(
			new Error(`Expected #${length} bytes, but got #${buffer.length}`),
		)
	}

	const asString = buffer.toString('hex')

	return ok({
		toString: () => asString,
		equals: (other: AtomIdentifier) => other.toString() === asString,
	})
}
