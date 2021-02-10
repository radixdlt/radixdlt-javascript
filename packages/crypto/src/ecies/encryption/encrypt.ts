import { err, ok, Result } from 'neverthrow'
import { generateKeyPair } from '../../keyPair'
import { secureRandomGenerator } from '@radixdlt/util'
import { ECIESEncryptedMessage } from '../_types'
import { ECIESEncryptInput } from './_types'
import { sharedInputOrEmpty } from '../sharedInfo'

/*
 * We use terminology/notation from SEC-1 (section 5.1) - https://www.secg.org/SEC1-Ver-1.0.pdf
 *
 * But a generalized version of it, where DH, KDF, MAC, ENC all are functions being passed into
 * the algorithm.
 */
// eslint-disable-next-line max-lines-per-function
export const eciesEncrypt = (
	input: ECIESEncryptInput,
): Result<ECIESEncryptedMessage, Error> => {
	// Message `M` to encrypt
	const M = input.M
	const sharedInfo = sharedInputOrEmpty(input)
	const encryptionScheme = input.procedures.encryptionScheme
	const enckeylen = encryptionScheme.length
	const macScheme = input.procedures.messageAuthenticationCodeScheme
	const mackeylen = macScheme.length
	const kdfScheme = input.procedures.keyDerivationScheme

	if (kdfScheme.length !== enckeylen + mackeylen)
		return err(
			new Error(
				'KDF scheme mismatch, length is not equal to sum of MAC.length and ENC.length, which is required.',
			),
		)

	// 1️⃣ Select (generate) an ephemeral elliptic curve key pair 􏰃`(k,􏰊 R)􏰄
	const ephemeralKeyPairResult = generateKeyPair(
		input.secureRandom ?? secureRandomGenerator,
	)
	if (ephemeralKeyPairResult.isErr())
		return err(new Error('Failed to generate ephemeral keys'))
	const ephemeralKeyPair = ephemeralKeyPairResult.value
	// Ephemeral public key `R = kG = (Rx, Ry)`
	const k = ephemeralKeyPair.privateKey
	const R = ephemeralKeyPair.publicKey

	// 2️⃣ Convert `R` to an octet string `Ṝ`
	const Ṝ = R.asData({ compressed: true })

	// 3️⃣ Use Diffie-Hellman to derive a shared secret `z` 􏰖from ephemeral secret key `k` and `peerPublicKey`
	const z = input.procedures.diffieHellman({
		privateKey: k,
		publicKey: input.peerPublicKey,
	})
	// 4️⃣ Convert `z` to an octet string `Z` (Omitted becuase irrelevant)

	// 5️⃣ Use `KDF` to generate key `K`.
	// 💡 We have generalized this to use passed in functions.
	const kdfInput = kdfScheme.combineDataForKDFInput({
		sharedSecretPoint: z,
		sharedInfo,
	})
	const K = kdfScheme.keyDerivationFunction(kdfInput)
	if (K.length !== enckeylen + mackeylen)
		return err(new Error('Wrong length of KDF output'))

	// 6️⃣ Parse `K` into encryption key `EK` and MAC key `MK`
	const EK = K.slice(0, enckeylen)
	const MK = K.slice(mackeylen)

	// 7️⃣ Use symmetric encryption with `EK` as key to encrypt message `M`.
	// 💡 We have generalized this to use passed in functions.
	const ENC = encryptionScheme.encryptionFunctionBuilder.buildEncryptionFunction(
		{
			key: EK,
			sharedInfo,
		},
	)
	const dataToEncrypt = encryptionScheme.combineDataIntoCryptInput({
		message: M,
		sharedInfo,
	})
	const EM = ENC.encrypt({ dataToEncrypt })

	// 8️⃣ Use `MAC` to compute the tag `D` with `MK` as key
	// 💡 We have generalized this to use passed in functions.
	const dataToTag = macScheme.combineDataForMACInput({
		sharedInfo,
		cipher: EM,
		ephemeralPublicKey: R,
	})
	const D = macScheme.macFunction({ data: dataToTag, key: MK })

	// 9️⃣ Output `C = Ṝ || EM || D`
	const C = Buffer.concat([Ṝ, EM, D])

	return ok({
		cipherText: EM,
		sharedSecret: Ṝ,
		tag: D,
		toBuffer: () => C,
	})
}
