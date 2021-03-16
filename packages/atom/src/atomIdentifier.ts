import { AtomIdentifierT } from './_types'
import { err, ok, Result } from 'neverthrow'
import { Byte, isString } from '@radixdlt/util'
import { decoder, DSONObjectEncoding } from '@radixdlt/data-formats'

const CBOR_BYTESTRING_PREFIX: Byte = 6

const JSONDecoder = decoder<AtomIdentifierT>((value, key) =>
	key === 'atomIdentifier' && isString(value) ? create(value) : undefined,
)

const create = (bytes: Buffer | string): Result<AtomIdentifierT, Error> => {
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
		equals: (other: AtomIdentifierT) => other.toString() === asString,
	})
}

export const AtomIdentifier = {
	create,
	JSONDecoder,
}
