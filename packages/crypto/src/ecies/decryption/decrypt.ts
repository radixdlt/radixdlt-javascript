import { err, ok, Result } from 'neverthrow'
import { publicKeyFromBytes } from '../../publicKey'
import { buffersEquals } from '@radixdlt/util'
import { ECIESDecryptInput } from './_types'
import { sharedInputOrEmpty } from '../sharedInfo'

/*
 * We use terminology/notation from SEC-1 (section 5.1) - https://www.secg.org/SEC1-Ver-1.0.pdf
 *
 * But a generalized version of it, where DH, KDF, MAC, ENC all are functions being passed into
 * the algorithm.
 */
// eslint-disable-next-line max-lines-per-function
export const eciesDecrypt = (
	input: ECIESDecryptInput,
): Result<Buffer, Error> => {
	// Encrypted Message `EM`, to decrypt.
	const EM = input.encryptedMessage.cipherText
	const sharedInfo = sharedInputOrEmpty(input)
	const decryptionScheme = input.procedures.decryptionScheme
	const enckeylen = decryptionScheme.length
	const macScheme = input.procedures.messageAuthenticationCodeScheme
	const mackeylen = macScheme.length
	const kdfScheme = input.procedures.keyDerivationScheme

	//  1️⃣ Parse buffer. Done in earlier step, which produced `ECIESDecryptInput`
	const Ṝ = input.encryptedMessage.sharedSecret

	// 2️⃣ Convert octet string `Ṝ` to an elliptic curve point R
	// 3️⃣ Assure that Ṝ is valid key, done in `publicKeyFromBytes`
	const ephemeralPubKeyRes = publicKeyFromBytes(Ṝ)
	if (ephemeralPubKeyRes.isErr())
		return err(new Error('Failed to parse ephemeral pub key'))
	const R = ephemeralPubKeyRes.value

	// 4️⃣ Use Diffie-Hellman to derive a shared secret `R` and peer's private key
	const z = input.procedures.diffieHellman({
		privateKey: input.privateKey, // `V`'s private key `d_v`
		publicKey: R,
	})
	// 5️⃣ Convert `z` to an octet string `Z` (Omitted becuase irrelevant).

	// 6️⃣ Use `KDF` to generate key `K`.
	// 💡 We have generalized this to use passed in functions.
	const kdfInput = kdfScheme.combineDataForKDFInput({
		sharedSecretPoint: z,
		sharedInfo,
	})
	const K = kdfScheme.keyDerivationFunction(kdfInput)
	if (K.length !== enckeylen + mackeylen)
		return err(new Error('Wrong length of KDF output'))

	// 7️⃣ Parse `K` into encryption key `EK` and MAC key `MK`
	const EK = K.slice(0, enckeylen)
	const MK = K.slice(mackeylen)

	// 8️⃣ Use `MAC` to compute the tag `D` with `MK` as key.
	// Check that `D` is equal to the `input.encryptedMessage.tag`
	// 💡 We have generalized this to use passed in functions.
	const dataToTag = macScheme.combineDataForMACInput({
		sharedInfo,
		cipher: EM,
		ephemeralPublicKey: R,
	})
	const D = macScheme.macFunction({ data: dataToTag, key: MK })

	if (!buffersEquals(D, input.encryptedMessage.tag))
		return err(new Error('MAC Mismatch'))

	// 9️⃣ Use symmetric encryption with `EK` as key to encrypt message `M`.
	// 💡 We have generalized this to use passed in functions.
	const decryptionFunction = decryptionScheme.decryptionFunctionBuilder.buildDecryptionFunction(
		{ key: EK, sharedInfo },
	)
	const dataToDecrypt = decryptionScheme.combineDataIntoCryptInput({
		message: EM,
		sharedInfo,
	})
	const decrypted = decryptionFunction.decrypt({ cipher: dataToDecrypt })

	return ok(decrypted)
}
