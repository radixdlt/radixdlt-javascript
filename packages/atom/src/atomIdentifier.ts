import { AtomIdentifier } from './_types'
import { err, ok, Result } from 'neverthrow'
import { Byte } from '@radixdlt/util'
import { DSONObjectEncoding } from '@radixdlt/data-formats'

const CBOR_BYTESTRING_PREFIX: Byte = 6

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
		...DSONObjectEncoding({
			prefix: CBOR_BYTESTRING_PREFIX,
			buffer,
		}),
		toString: () => asString,
		equals: (other: AtomIdentifier) => other.toString() === asString,
	})
}
