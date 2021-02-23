import { radixHash } from '@radixdlt/crypto'
import { DSONCodable, OutputMode } from '@radixdlt/data-formats'
import { buffersEquals } from '@radixdlt/util'
import { combine, Result } from 'neverthrow'

export const hashId = <T extends DSONCodable>(
	dsonEncodable: T,
): Result<Buffer, Error> =>
	dsonEncodable.toDSON(OutputMode.HASH).map((b) => radixHash(b))

export const equalsDSONHash = <T extends DSONCodable>(
	lhs: T,
	rhs: T,
): boolean =>
	combine([hashId(lhs), hashId(rhs)])
		.map((l) => buffersEquals(l[0], l[1]))
		.unwrapOr(false)
