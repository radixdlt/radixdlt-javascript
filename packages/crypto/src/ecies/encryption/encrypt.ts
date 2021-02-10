import { err, ok, Result } from 'neverthrow'
import { generateKeyPair } from '../../keyPair'
import { secureRandomGenerator } from '@radixdlt/util'
import { ECIESEncryptedMessage } from '../_types'
import { ECIESEncryptInput } from './_types'

/*
 * We use terminology/notation from SEC-1 (section 5.1) - https://www.secg.org/SEC1-Ver-1.0.pdf
 * With the following MODIFICATIONs,
 * 💡 Instead of `U` for encrypter, we say `Alice`. And let `a` denote
 * her private key, and `A = aG` denote her public key, produced by performin EC point multiplication
 * with the generator point of the curve `G`.
 * 💡 Instead of `V` for decrypter, we say `Bob` and let `b` denote his private key and let `B = bG` be his
 * public key.
 *
 * Alice would like to encrypt a message `m` to be decryptable by only Bob. See https://crypto.stackexchange.com/q/88083/60476
 * for info about enable multiple readers be able to decrypt the encrypted message produced by this function.
 *
 * Input:
 *  0. 💡 `peerPublicKey` - Public Key of the peer that should be able to decrypt
 * 	1. An octet string `M` which is the message to be encrypted.
 *  2. (optional) sharedInfo1 and sharedInfo2 used as input to KDF and tag (MAC) function respectively
 *	Modification: We also let these variables/functions be input to the encryption function:
 *  3. 💡 Randomness
 *  4. 💡 Diffie-Hellman routine
 *  5. 💡 The Key Derivation Scheme (KDF)
 *  6. 💡 Encrytion scheme (length + function `ENC`)
 *  7. 💡 Message Authentication Code scheme (length + function `MAC`)
 *
 * Output:
 * 1. An octet string C which is an encryption of M, or ‘invalid’.
 *
 * We modify the output to include more into:
 * {
 *	cipherText: EM,
 *	sharedSecret: Ṝ,
 *	tag: D,
 *	toBuffer: () => concatenate the produced non-sensitive data...
 * }
 */
// eslint-disable-next-line max-lines-per-function
export const eciesEncrypt = (
	input: ECIESEncryptInput,
): Result<ECIESEncryptedMessage, Error> => {
	const secureRandom = input.secureRandom ?? secureRandomGenerator
	const M = input.M
	const sharedInfo1 = input.sharedInfo?.s1 ?? Buffer.alloc(0)
	const sharedInfo2 = input.sharedInfo?.s2 ?? Buffer.alloc(0)
	const sharedInfo = { s1: sharedInfo1, s2: sharedInfo2 }
	const peerPublicKey = input.peerPublicKey

	const procedures = input.setupProcedure

	const encryptionScheme = procedures.encryptionScheme
	const enckeylen = encryptionScheme.length
	const combineDataIntoCryptInput = encryptionScheme.combineDataIntoCryptInput
	const encryptionFunctionBuilder = encryptionScheme.encryptionFunctionBuilder

	const macScheme = procedures.messageAuthenticationCodeScheme
	const mackeylen = macScheme.length
	const MAC = macScheme.macFunction
	const combineDataForMACInput = macScheme.combineDataForMACInput

	const kdfScheme = procedures.keyDerivationScheme
	const combineDataForKDFInput = kdfScheme.combineDataForKDFInput
	const KDF = kdfScheme.keyDerivationFunction

	if (kdfScheme.length !== enckeylen + mackeylen)
		return err(
			new Error(
				'KDF scheme mismatch, length is not equal to sum of MAC.length and ENC.length, which is required.',
			),
		)
	const DH = procedures.diffieHellmanRoutine

	/*
	 * 1️⃣
	 * Select an ephemeral elliptic curve key pair 􏰃`(k,􏰊 R)􏰄 with `R􏰆 = (􏰃xR􏰊, yR)􏰄
	 * associated with the elliptic curve domain parameters `T` established
	 * during the setup procedure
	 */
	const ephemeralKeyPairResult = generateKeyPair(secureRandom)
	if (ephemeralKeyPairResult.isErr())
		return err(new Error('Failed to generate ephemeral keys'))
	const ephemeralKeyPair = ephemeralKeyPairResult.value

	// Ephemeral public key `R = kG = (Rx, Ry)`
	const k = ephemeralKeyPair.privateKey
	const R = ephemeralKeyPair.publicKey

	/*
	 * 2️⃣
	 * Convert `R` to an octet string `Ṝ` using conversion routine
	 */
	const Ṝ = R.asData({ compressed: true })

	/*
	 * 3️⃣
	 * Use one of the Diffie-Hellman primitive to derive a shared secret field element `z`
	 * 􏰖from the ephemeral secret key `k` and Bob's public key `B`.
	 */
	const z = DH({ privateKey: k, publicKey: peerPublicKey })
	/*
	 *4️⃣
	 * Convert `z` to an octet string `Z` using conversion routine
	 * 💡 OMITTED: we feed `z` into KDF instead.
	 */

	/*
	 * 5️⃣
	 * Use the key derivation function `KDF` to generate keying data `K` of length `enckeylen + mackeylen`
	 * octets from `Z` and `[SharedInfo1]`: Z||S1.
	 * 💡 Modified: We feed `z||S1` instead
	 */
	const kdfInput = combineDataForKDFInput({
		sharedSecretPoint: z,
		sharedInfo,
	})
	const K = KDF(kdfInput)
	if (K.length !== enckeylen + mackeylen)
		return err(new Error('Wrong length of KDF output'))

	/*
	 * 6️⃣
	 * Parse the leftmost `enckeylen` octets of `K` as an encryption key `EK` and
	 * the rightmost `mackeylen` octets of K as a MAC key `MK`
	 */
	const EK = K.slice(0, enckeylen)
	const MK = K.slice(mackeylen)

	/*
	 * 7️⃣
	 * Use the encryption operation of the symmetric encryption scheme `ENC` to
	 * encrypt `M` under `EK` as ciphertext `EM`.
	 * 💡 Modified: We pass in two function, one for building the encryption operation
	 * and one for building input to encrypt.
	 */
	const ENC = encryptionFunctionBuilder.buildEncryptionFunction({
		key: EK,
		sharedInfo,
	})
	const dataToEncrypt = combineDataIntoCryptInput({ message: M, sharedInfo })
	const EM = ENC.encrypt({ dataToEncrypt })

	/*
	 * 8️⃣
	 * Use the tagging operation of the MAC scheme `MAC` to compute the
	 * tag `D` under `MK` on 🗑 REPLACED: `EM || [SharedInfo2]` 🗑
	 * 💡 Replaced with function to compute input
	 */
	const dataToTag = combineDataForMACInput({
		sharedInfo: { s1: sharedInfo1, s2: sharedInfo2 },
		cipher: EM,
		ephemeralPublicKey: R,
	})
	const D = MAC({ data: dataToTag, key: MK })

	/*
	 * 9️⃣
	 * Output `C = Ṝ || EM || D`
	 */
	const C = Buffer.concat([Ṝ, EM, D])

	return ok({
		cipherText: EM,
		sharedSecret: Ṝ,
		tag: D,
		toBuffer: () => C,
	})
}
