import baseX from 'base-x'
import { Result, ok, err } from 'neverthrow'

const base58Alphabet =
	'123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

const base58 = baseX(base58Alphabet)
export const base58Encode = (input: Buffer): string => {
	return base58.encode(input)
}

export const base58Decode = (input: string): Result<Buffer, Error> => {
	// eslint-disable-next-line functional/no-try-statement
	try {
		const decoded = base58.decode(input)
		return ok(decoded)
	} catch (e) {
		return err(e)
	}
}
