import { err, ok, Result } from 'neverthrow'
import { SemVerT } from '../_types'

const create = (
	input: Readonly<{ major: number; minor: number; patch: number }>,
): SemVerT => {
	const { major, minor, patch } = input
	const toString = (): string => {
		return [major, minor, patch]
			.map((n: number): string => {
				return n.toString()
			})
			.join('.')
	}

	return {
		major,
		minor,
		patch,
		toString,
	}
}

const from = (buf: Buffer): Result<SemVerT, Error> => {
	const expectedByteCount = 3
	if (buf.length !== expectedByteCount) {
		return err(
			new Error(
				`Incorrect length of buffer, expected ${expectedByteCount} bytes`,
			),
		)
	}

	const major = buf.readUInt8(0)
	const minor = buf.readUInt8(1)
	const patch = buf.readUInt8(2)

	return ok(create({ major, minor, patch }))
}

export const SemVer = {
	from,
	create,
}
