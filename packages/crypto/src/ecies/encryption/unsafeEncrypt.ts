import { PublicKey } from '../../_types'
import { SecureRandom, secureRandomGenerator } from '@radixdlt/util'
import { Result } from 'neverthrow'
import { ECIESEncryptedMessage, ECIESEncryptProcedures } from '../_types'
import { IVByteCount } from '../_index'
import { unsafeECIESEncryptionProcedures } from './_index'
import { formatOutput } from './formatOutput'
import { eciesEncrypt } from './encrypt'

export const unsafeEncrypt = (
	input: Readonly<{
		message: Buffer
		peerPublicKey: PublicKey
		secureRandom?: SecureRandom
		procedures?: ECIESEncryptProcedures
	}>,
): Result<ECIESEncryptedMessage, Error> => {
	const procedures = input.procedures ?? unsafeECIESEncryptionProcedures
	const secureRandom = input.secureRandom ?? secureRandomGenerator
	const iv = Buffer.from(secureRandom.randomSecureBytes(IVByteCount), 'hex')

	return eciesEncrypt({
		peerPublicKey: input.peerPublicKey,
		M: input.message,
		sharedInfo: { s2: iv },
		secureRandom,
		procedures,
	}).map((encryptedMessage) => ({
		...encryptedMessage,
		toBuffer: (): Buffer => formatOutput({ encryptedMessage, iv }),
	}))
}
