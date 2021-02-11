import { ECPointOnCurve } from '../_types'
import {
	DiffieHellmanDecryptionInput,
	DiffieHellmanEncryptionInput,
	DiffieHellmanInput,
} from './_types'

/* eslint-disable */
export const diffieHellmanPublicKey = <I extends DiffieHellmanInput>(
	input: I,
): ECPointOnCurve => {
	const privateKey =
		(input as DiffieHellmanEncryptionInput).ephemeralPrivateKey ??
		(input as DiffieHellmanDecryptionInput).privateKey
	const publicKey =
		(input as DiffieHellmanEncryptionInput).publicKey ??
		input.ephemeralPublicKey

	return publicKey.decodeToPointOnCurve().multiplyWithPrivateKey(privateKey)
}
/* eslint-enable */
