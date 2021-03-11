import { scrypt } from 'crypto'
import { ResultAsync, errAsync } from 'neverthrow'
import { ScryptParamsT } from './_types'

const deriveKey = (
	input: Readonly<{
		password: Buffer
		kdf: string
		params: ScryptParamsT
	}>,
): ResultAsync<Buffer, Error> => {
	if (input.kdf !== 'scrypt')
		return errAsync(new Error('Wrong KDF, expected scrypt'))
	const { params, password } = input
	const {
		lengthOfDerivedKey,
		costParameterN,
		blockSize,
		parallelizationParameter,
	} = params
	const salt = Buffer.from(params.salt, 'hex')

	return ResultAsync.fromPromise(
		new Promise((resolve, reject) => {
			scrypt(
				password,
				salt,
				lengthOfDerivedKey,
				{
					N: costParameterN,
					r: blockSize,
					p: parallelizationParameter,
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
		() => new Error(`Failed to derive data using scrypt`),
	)
}

export const Scrypt = {
	deriveKey,
}
