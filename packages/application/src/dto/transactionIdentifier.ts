import { err, ok, Result } from 'neverthrow'
import { Byte, isString } from '@radixdlt/util'
import { decoder, DSONObjectEncoding } from '@radixdlt/data-formats'
import { TransactionIdentifierT } from './_types'

const CBOR_BYTESTRING_PREFIX: Byte = 6

const JSONDecoder = decoder<TransactionIdentifierT>((value, key) =>
	key === 'txID' && isString(value) ? create(value) : undefined,
)

const create = (
	bytes: Buffer | string,
): Result<TransactionIdentifierT, Error> => {
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
		__hex: asString,
		toString: () => asString,
		equals: (other: TransactionIdentifierT) =>
			other.toString() === asString,
	})
}

export const TransactionIdentifier = {
	create,
	JSONDecoder,
}
