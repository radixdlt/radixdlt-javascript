import { ECPointOnCurve, PrivateKey, PublicKey } from '../_types'
import { SecureRandom } from '@radixdlt/util'
import { Result } from 'neverthrow'
import {
	ECIESDecryptProcedures,
	ECIESEncryptedMessage,
	ECIESEncryptProcedures,
} from './_types'
import { unsafeEncrypt } from './encryption/unsafeEncrypt'
import { unsafeDecrypt } from './decryption/unsafeDecrypt'
import { unsafeECIESEncryptionProcedures } from './encryption/unsafeECIESEncryptionProcedures'
import { DiffieHellmanInput } from '../key-exchange/_types'
import { unsafeECIESDecryptionProcedures } from './decryption/unsafeECIESDecryptionProcedures'

// A variant of ECIES using DH between sender and recipient
// and then EC point addition for creation of shared secret
// point (`S` in notation used by wikipedia/ECIES or
// crypto.stackexchange post, or `z` using 'SEC-1' terminolgy)
//
// https://crypto.stackexchange.com/q/88083/60476
const makeCyonDH = (peerPrivateKey: PrivateKey, peerPublicKey: PublicKey) => (
	input: DiffieHellmanInput,
): ECPointOnCurve => {
	const dh = peerPublicKey
		.decodeToPointOnCurve()
		.map((pointOnCurve) =>
			pointOnCurve.multiplyWithPrivateKey(peerPrivateKey),
		)
		._unsafeUnwrap()

	const ephemeralPoint = input.ephemeralPublicKey
		.decodeToPointOnCurve()
		._unsafeUnwrap()
	return dh.add(ephemeralPoint)
}
export const unsafeCyonEncrypt = (
	input: Readonly<{
		message: Buffer
		senderPrivateKey: PrivateKey
		peerPublicKey: PublicKey
		secureRandom?: SecureRandom
	}>,
): Result<ECIESEncryptedMessage, Error> =>
	unsafeEncrypt({
		...input,
		procedures: <ECIESEncryptProcedures>{
			...unsafeECIESEncryptionProcedures,
			diffieHellman: makeCyonDH(
				input.senderPrivateKey,
				input.peerPublicKey,
			),
		},
	})

export const unsafeCyonDecrypt = (
	input: Readonly<{
		buffer: Buffer
		publicKey: PublicKey
		privateKey: PrivateKey
	}>,
): Result<Buffer, Error> =>
	unsafeDecrypt({
		...input,
		procedures: <ECIESDecryptProcedures>{
			...unsafeECIESDecryptionProcedures,
			diffieHellman: makeCyonDH(input.privateKey, input.publicKey),
		},
	})
