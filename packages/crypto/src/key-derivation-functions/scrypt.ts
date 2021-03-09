import { scrypt } from 'crypto'
import { ResultAsync } from 'neverthrow'
import { ScryptParams } from '../keystore/_types'

export const scryptKDF = (
	input: Readonly<{
		key: Buffer
		kdf: 'scrypt'
		params: ScryptParams
	}>,
): ResultAsync<Buffer, Error> => {
	const params = input.params
	const salt = Buffer.from(params.salt, 'hex')

	return ResultAsync.fromPromise(
		new Promise((resolve, reject) => {
			scrypt(
				input.key,
				salt,
				params.lengthOfDerivedKey,
				{
					N: params.costParameterN,
					r: params.blockSize,
					p: params.parallelizationParameter,
				},
				(maybeError, key) => {
					if (!maybeError && key) {
						resolve(key)
					} else if (maybeError && !key) {
						reject(key)
					} else {
						throw new Error('Incorrect impl.')
					}
				},
			)
		}),
		(error) =>
			new Error(`Failed to decrypt data using scrypt, error: ${error}`),
	)
}
