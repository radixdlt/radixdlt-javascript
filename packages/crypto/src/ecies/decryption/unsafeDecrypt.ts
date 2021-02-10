import { PrivateKey } from '../../_types'
import { combine, Result } from 'neverthrow'
import { eciesDecrypt } from './decrypt'
import { ECIESEncryptedMessage, SharedInfo } from '../_types'
import { makeBufferReader } from './bufferReader'
import { unsafeECIESDecryptionProcedures } from './unsafeECIESDecryptionProcedures'
import { ECIESDecryptInput, IVByteCount } from '../_index'

export const unsafeDecrypt = (
	input: Readonly<{
		buffer: Buffer
		privateKey: PrivateKey
	}>,
): Result<Buffer, Error> => {
	const procedures = unsafeECIESDecryptionProcedures
	const macScheme = procedures.messageAuthenticationCodeScheme

	const reader = makeBufferReader(input.buffer)
	return combine([
		reader.nextBuffer(IVByteCount),
		reader
			.nextBuffer(1)
			.map((keyLenBuf) => keyLenBuf.readUInt8())
			.andThen((keyLenNum) => reader.nextBuffer(keyLenNum)),
		reader
			.nextBuffer(4) // This means that our cihertext can be at most 2^32 = 4.3 billion chars long.
			.map((cipherLenBuf) => cipherLenBuf.readUInt32BE())
			.andThen((cipherLenNum) => reader.nextBuffer(cipherLenNum)),
		reader.nextBuffer(macScheme.length),
	])
		.map(
			(parsed): ECIESDecryptInput => {
				const iv = parsed[0]
				const sharedSecret = parsed[1]
				const cipherText = parsed[2]
				const macBuf = parsed[3]

				const encryptedMessage = <ECIESEncryptedMessage>{
					cipherText,
					sharedSecret,
					tag: macBuf,
					toBuffer: () => input.buffer,
				}

				return {
					encryptedMessage,
					privateKey: input.privateKey,
					procedures: procedures,
					sharedInfo: <SharedInfo>{
						s2: iv,
					},
				}
			},
		)
		.andThen(eciesDecrypt)
}
