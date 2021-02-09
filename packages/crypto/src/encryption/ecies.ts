import { err, ok, Result } from 'neverthrow'
import { generateKeyPair } from '../keyPair'
import { ECPointOnCurve, KeyPair, PublicKey } from '../_types'
import { SecureRandom, secureRandomGenerator } from '@radixdlt/util'
import { sha512Twice } from '../algorithms'
import { createHmac, createCipheriv } from 'crypto'

export type ECIESEncryptedMessage = Readonly<{
	cipherText: Buffer // `EM`
	sharedSecret: Buffer // `R`, i.e. ephemeral public key
	tag: Buffer // `D`, e.g. MAC(kM, c||S2)
	toBuffer: () => Buffer // C := R || EM || D
}>

export type SharedInfo = Readonly<{
	// `s1` (optional shared information), if present, is fed into KDF (Key Derivation Function), that produces a symmetric encryption key
	s1?: Buffer
	// `s2` (optional shared information), if present, is fed into the "tag" (MAC)
	s2?: Buffer
}>

export type DiffieHellmanRoutine = (
	input: Readonly<{
		ephemeralKeyPair: KeyPair
		peerPublicKey: PublicKey
	}>,
) => ECPointOnCurve

export type KeyDerivationScheme = Readonly<{
	length: number
	keyDerivationFunction: (input: {
		sharedSecret: ECPointOnCurve
		sharedInfo: Buffer
	}) => Buffer
}>

export type EncryptionScheme = Readonly<{
	/// `enckeylen`
	length: number
	/// `ENC`
	encryptionFunction: (
		input: Readonly<{ message: Buffer; key: Buffer; iv?: Buffer }>,
	) => Buffer
}>

export const AES256CBCEncryption: EncryptionScheme = {
	length: 32,
	encryptionFunction: (
		input: Readonly<{ message: Buffer; key: Buffer; iv?: Buffer }>,
	): Buffer => {
		const iv = input.iv ?? Buffer.alloc(0)
		const cipher = createCipheriv('aes-256-cbc', input.key, iv)
		const firstChunk = cipher.update(input.message)
		const secondChunk = cipher.final()
		return Buffer.concat([firstChunk, secondChunk])
	},
}

export type MessageAuthenticationCodeScheme = Readonly<{
	// `mackeylen`
	length: number
	/// `MAC`
	macFunction: (input: Readonly<{ data: Buffer; key: Buffer }>) => Buffer
}>

export type ECIESEncryptInput = Readonly<{
	peerPublicKey: PublicKey
	M: Buffer // message to encrypt
	sharedInfo?: SharedInfo
	secureRandom?: SecureRandom
	diffieHellmanRoutine: DiffieHellmanRoutine
	keyDerivationScheme: KeyDerivationScheme
	encryptionScheme: EncryptionScheme
	messageAuthenticationCodeScheme: MessageAuthenticationCodeScheme
}>

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
 *	toBuffer: () => C,
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
	const peerPublicKey = input.peerPublicKey
	const enckeylen = input.encryptionScheme.length
	const ENC = input.encryptionScheme.encryptionFunction
	const mackeylen = input.messageAuthenticationCodeScheme.length
	const KDF = input.keyDerivationScheme.keyDerivationFunction
	if (input.keyDerivationScheme.length !== enckeylen + mackeylen)
		return err(
			new Error(
				'KDF scheme mismatch, length is not equal to sum of MAC.length and ENC.length, which is required.',
			),
		)
	const MAC = input.messageAuthenticationCodeScheme.macFunction

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
	const z = input.diffieHellmanRoutine({ ephemeralKeyPair, peerPublicKey })
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
	const K = KDF({ sharedSecret: z, sharedInfo: sharedInfo1 })
	if (K.length !== enckeylen + mackeylen)
		return err(new Error('Wrong length of KDF output'))

	/*
	 * 6️⃣
	 * Parse the leftmost `enckeylen` octets of `K` as an encryption key `EK` and
	 * the rightmost `mackeylen` octets of K as a MAC key `MK`
	 */
	const EK = K.slice(0, enckeylen)
	const MK = K.slice(enckeylen, mackeylen)

	/*
	 * 7️⃣
	 * Use the encryption operation of the symmetric encryption scheme `ENC` to
	 * encrypt `M` under `EK` as ciphertext `EM`.
	 * 💡 Modified: We also pass S2 to encryption scheme,
	 * e.g. if we use AESwithIV, and S2 is our IV.
	 */
	const EM = ENC({ message: M, key: EK, iv: sharedInfo2 })

	/*
	 * 8️⃣
	 * Use the tagging operation of the MAC scheme `MAC` to compute the
	 * tag `D` on `EM || [SharedInfo2]` under `MK`.
	 */
	const EMￜￜS2 = Buffer.concat([EM, sharedInfo2])
	const D = MAC({ data: EMￜￜS2, key: MK })

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

export const SimpleKDF: KeyDerivationScheme = {
	length: 64,
	keyDerivationFunction: (input: {
		sharedSecret: ECPointOnCurve
		sharedInfo: Buffer
	}): Buffer => {
		const secretBytes = Buffer.from(input.sharedSecret.x.toByteArray())
		const shaInput = Buffer.concat([secretBytes, input.sharedInfo])
		return sha512Twice(shaInput)
	},
}

export const HMACSHA256: MessageAuthenticationCodeScheme = {
	length: 32,
	macFunction: (input: Readonly<{ data: Buffer; key: Buffer }>): Buffer =>
		createHmac('sha256', input.key).update(input.data).digest(),
}

export const encrypt = (
	input: Readonly<{
		message: Buffer
		peerPublicKey: PublicKey
		secureRandom?: SecureRandom
	}>,
): Result<ECIESEncryptedMessage, Error> => {
	const secureRandom = input.secureRandom ?? secureRandomGenerator

	const IV = Buffer.from(secureRandom.randomSecureBytes(16), 'hex')

	const diffieHellmanRoutine: DiffieHellmanRoutine = (
		input: Readonly<{
			ephemeralKeyPair: KeyPair
			peerPublicKey: PublicKey
		}>,
	): ECPointOnCurve =>
		input.peerPublicKey
			.decodeToPointOnCurve()
			._unsafeUnwrap()
			.multiplyWithPrivateKey(input.ephemeralKeyPair.privateKey)

	return eciesEncrypt({
		peerPublicKey: input.peerPublicKey,
		M: input.message,
		sharedInfo: <SharedInfo>{
			s1: undefined,
			s2: IV,
		},
		secureRandom,
		diffieHellmanRoutine,
		keyDerivationScheme: SimpleKDF,
		encryptionScheme: AES256CBCEncryption,
		messageAuthenticationCodeScheme: HMACSHA256,
	})
}
