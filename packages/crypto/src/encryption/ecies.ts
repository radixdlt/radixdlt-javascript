import { ECIESEncryptedMessage, ECIESEncryptInput } from './_types'

import { PublicKey } from '../_types'
import { err, Result } from 'neverthrow'

export const encrypt = (
	input: ECIESEncryptInput,
): Result<ECIESEncryptedMessage, Error> => {
	return err(new Error('Impl me'))
}
