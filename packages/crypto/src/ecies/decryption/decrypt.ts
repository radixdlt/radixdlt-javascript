import { err, ok, Result } from 'neverthrow'
import { publicKeyFromBytes } from '../../publicKey'
import { buffersEquals } from '@radixdlt/util'
import { ECIESDecryptInput } from './_types'
import { SharedInfo } from '../_types'

export const eciesDecrypt = (
	input: ECIESDecryptInput,
): Result<Buffer, Error> => {
	const sharedInfo1 = input.sharedInfo?.s1 ?? Buffer.alloc(0)
	const sharedInfo2 = input.sharedInfo?.s2 ?? Buffer.alloc(0)
	const sharedInfo = <SharedInfo>{ s1: sharedInfo1, s2: sharedInfo2 }

	const procedures = input.setupProcedure

	const decryptionScheme = procedures.decryptionScheme
	const enckeylen = decryptionScheme.length
	const combineDataIntoCryptInput = decryptionScheme.combineDataIntoCryptInput
	const decryptionFunctionBuilder = decryptionScheme.decryptionFunctionBuilder

	const macScheme = procedures.messageAuthenticationCodeScheme
	const combineDataForMACInput = macScheme.combineDataForMACInput
	const mackeylen = macScheme.length
	const MAC = macScheme.macFunction

	const kdfScheme = procedures.keyDerivationScheme
	const combineDataForKDFInput = kdfScheme.combineDataForKDFInput
	const KDF = kdfScheme.keyDerivationFunction

	const DH = procedures.diffieHellmanRoutine

	/*
	 * 1️⃣
	 * Done in earlier step, which produced `ECIESDecryptInput`
	 */
	const Ṝ = input.encryptedMessage.sharedSecret
	const EM = input.encryptedMessage.cipherText
	const expectedMAC = input.encryptedMessage.tag

	/*
	 * 2️⃣
	 * Convert octet string `Ṝ` to an elliptic curve point R
	 * 3️⃣ is part of `decodeToPointOnCurve`
	 */
	const ephemeralPubKeyRes = publicKeyFromBytes(Ṝ)
	if (ephemeralPubKeyRes.isErr())
		return err(new Error('Failed to parse ephemeral pub key'))
	const R = ephemeralPubKeyRes.value

	/*
	 * 4️⃣
	 * Use one of the Diffie-Hellman primitive to derive a shared secret field element `z`
	 * 􏰖from the ephemeral secret key `k` and Bob's public key `B`.
	 */
	const z = DH({ privateKey: input.privateKey, publicKey: R })
	// 5️⃣ Convert `z` to an octet string `Z`. Irrelevant.

	/*
	 * 6️⃣
	 * Use the key derivation function `KDF` to generate keying data `K` using
	 * function computing input for KDF.
	 */
	const kdfInput = combineDataForKDFInput({
		sharedSecretPoint: z,
		sharedInfo,
	})
	const K = KDF(kdfInput)
	if (K.length !== enckeylen + mackeylen)
		return err(new Error('Wrong length of KDF output'))

	/*
	 * 7️⃣
	 * Parse the leftmost `enckeylen` octets of `K` as an encryption key `EK` and
	 * the rightmost `mackeylen` octets of K as a MAC key `MK`
	 */
	const EK = K.slice(0, enckeylen)
	const MK = K.slice(mackeylen)

	/*
	 * 8️⃣
	 * Use the tagging operation of the MAC scheme `MAC` to compute the
	 * tag `D` using key `MK` and function computing input data.
	 */
	const dataToTag = combineDataForMACInput({
		sharedInfo,
		cipher: EM,
		ephemeralPublicKey: R,
	})
	const D = MAC({ data: dataToTag, key: MK })

	if (!buffersEquals(D, expectedMAC)) return err(new Error('MAC Mismatch'))

	/*
	 * 9️⃣
	 * Use the encryption operation of the symmetric encryption scheme
	 * to decrypt `EM` with `EK` and sharedInfo.
	 */
	const decryptionFunction = decryptionFunctionBuilder.buildDecryptionFunction(
		{ key: EK, sharedInfo },
	)
	const dataToDecrypt = combineDataIntoCryptInput({ message: EM, sharedInfo })
	const decrypted = decryptionFunction.decrypt({ cipher: dataToDecrypt })

	return ok(decrypted)
}
