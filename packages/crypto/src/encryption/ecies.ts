import { err, ok, Result, combine } from 'neverthrow'
import { generateKeyPair } from '../keyPair'
import { ECPointOnCurve, KeyPair, PrivateKey, PublicKey } from '../_types'
import {
	buffersEquals,
	SecureRandom,
	secureRandomGenerator,
} from '@radixdlt/util'
import { sha512Twice } from '../algorithms'
import { createHmac, createCipheriv, createDecipheriv } from 'crypto'
import { publicKeyFromBytes } from '../publicKey'

export type ECIESEncryptedMessage = Readonly<{
	cipherText: Buffer // `EM`
	sharedSecret: Buffer // `R`, i.e. ephemeral public key
	tag: Buffer // `D`, e.g. MAC(kM, c||S2)
	toBuffer: () => Buffer // By default:  `C := R || EM || D`, but can be customized.
}>

export type DiffieHellmanRoutine = (
	input: Readonly<{
		privateKey: PrivateKey
		publicKey: PublicKey
	}>,
) => ECPointOnCurve

export const diffieHellmanPublicKey: DiffieHellmanRoutine = (
	input: Readonly<{
		privateKey: PrivateKey
		publicKey: PublicKey
	}>,
): ECPointOnCurve =>
	input.publicKey
		.decodeToPointOnCurve()
		.map((pointOnCurve) =>
			pointOnCurve.multiplyWithPrivateKey(input.privateKey),
		)
		._unsafeUnwrap()

export type SharedInfo = Readonly<{
	// `s1` (optional shared information), if present, is fed into KDF (Key Derivation Function), that produces a symmetric encryption key
	s1?: Buffer
	// `s2` (optional shared information), if present, is fed into the "tag" (MAC)
	s2?: Buffer
}>

export type KeyDerivationScheme = Readonly<{
	length: number
	/// Build input
	combineDataForKDFInput: (
		input: Readonly<{
			sharedSecretPoint: ECPointOnCurve
			sharedInfo: SharedInfo
		}>,
	) => Buffer
	keyDerivationFunction: (input: Buffer) => Buffer
}>

export const SimpleKDF: KeyDerivationScheme = {
	length: 64,
	combineDataForKDFInput: (
		input: Readonly<{
			sharedSecretPoint: ECPointOnCurve
			sharedInfo: SharedInfo
		}>,
	): Buffer => Buffer.from(input.sharedSecretPoint.x.toString(16), 'hex'),
	keyDerivationFunction: sha512Twice,
}

export type CombineDataIntoCryptInput = (
	input: Readonly<{
		message: Buffer
		sharedInfo: SharedInfo
	}>,
) => Buffer

export type Encryptor = Readonly<{
	encrypt: (input: Readonly<{ dataToEncrypt: Buffer }>) => Buffer
}>

export type EncryptionFunctionBuilder = Readonly<{
	buildEncryptionFunction: (
		input: Readonly<{
			key: Buffer
			sharedInfo: SharedInfo
		}>,
	) => Encryptor
}>

export type Decryptor = Readonly<{
	decrypt: (input: Readonly<{ cipher: Buffer }>) => Buffer
}>

export type DecryptionFunctionBuilder = Readonly<{
	buildDecryptionFunction: (
		input: Readonly<{
			key: Buffer
			sharedInfo: SharedInfo
		}>,
	) => Decryptor
}>

export type EncryptionScheme = Readonly<{
	/// `enckeylen`
	length: number
	combineDataIntoCryptInput: CombineDataIntoCryptInput
	encryptionFunctionBuilder: EncryptionFunctionBuilder
	// encryptionFunction: (
	// 	input: Readonly<{ key: Buffer; dataToEncrypt: Buffer }>,
	// ) => Buffer
}>

export type DecryptionScheme = Readonly<{
	/// `enckeylen`
	length: number
	combineDataIntoCryptInput: CombineDataIntoCryptInput
	// decryptFunction: (
	// 	input: Readonly<{ key: Buffer; cipher: Buffer }>,
	// ) => Buffer
	decryptionFunctionBuilder: DecryptionFunctionBuilder
}>

const simpleDataIntoCryptInputCombiner: CombineDataIntoCryptInput = (
	input: Readonly<{
		message: Buffer
		sharedInfo: SharedInfo
	}>,
): Buffer => input.message

export const simpleEncryptionFunctionBuilder = <EncryptionFunctionBuilder>{
	buildEncryptionFunction: (
		input: Readonly<{
			key: Buffer
			sharedInfo: SharedInfo
		}>,
	): Encryptor => ({
		encrypt: (input_: Readonly<{ dataToEncrypt: Buffer }>): Buffer => {
			const cipher = createCipheriv(
				'aes-256-cbc',
				input.key,
				input.sharedInfo.s2 ?? null,
			)
			const firstChunk = cipher.update(input_.dataToEncrypt)
			const secondChunk = cipher.final()
			return Buffer.concat([firstChunk, secondChunk])
		},
	}),
}


export const simpleDecryptionFunctionBuilder = <DecryptionFunctionBuilder>{
	buildDecryptionFunction: (
		input: Readonly<{
			key: Buffer
			sharedInfo: SharedInfo
		}>,
	): Decryptor => ({
		decrypt: (input_: Readonly<{ cipher: Buffer }>): Buffer => {
			const decipher = createDecipheriv(
				'aes-256-cbc',
				input.key,
				input.sharedInfo.s2 ?? null,
			)
			const firstChunk = decipher.update(input_.cipher)
			const secondChunk = decipher.final()
			return Buffer.concat([firstChunk, secondChunk])
		},
	}),
}

export const AES256CBCEncryption: EncryptionScheme = {
	length: 32,
	combineDataIntoCryptInput: simpleDataIntoCryptInputCombiner,
	encryptionFunctionBuilder: simpleEncryptionFunctionBuilder,
}

export const AES256CBCDecryption: DecryptionScheme = {
	length: 32,
	combineDataIntoCryptInput: simpleDataIntoCryptInputCombiner,
	decryptionFunctionBuilder: simpleDecryptionFunctionBuilder,
}

export type MessageAuthenticationCodeScheme = Readonly<{
	// `mackeylen`
	length: number
	/// Build input
	combineDataForMACInput: (
		input: Readonly<{
			sharedInfo: SharedInfo
			cipher: Buffer
			ephemeralPublicKey: PublicKey
		}>,
	) => Buffer
	/// `MAC`
	macFunction: (input: Readonly<{ data: Buffer; key: Buffer }>) => Buffer
}>

export type ECIESProcedures = Readonly<{
	diffieHellmanRoutine: DiffieHellmanRoutine
	keyDerivationScheme: KeyDerivationScheme
	messageAuthenticationCodeScheme: MessageAuthenticationCodeScheme
}>

export type ECIESEncryptProcedures = ECIESProcedures &
	Readonly<{
		encryptionScheme: EncryptionScheme
	}>

export type ECIESDecryptProcedures = ECIESProcedures &
	Readonly<{
		decryptionScheme: DecryptionScheme
	}>

export type ECIESEncryptInput = Readonly<{
	peerPublicKey: PublicKey
	M: Buffer // message to encrypt
	setupProcedure: ECIESEncryptProcedures
	sharedInfo?: SharedInfo
	secureRandom?: SecureRandom
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

export const HMACSHA256: MessageAuthenticationCodeScheme = {
	length: 32,
	combineDataForMACInput: (
		input: Readonly<{
			sharedInfo: SharedInfo
			cipher: Buffer
			ephemeralPublicKey: PublicKey
		}>,
	): Buffer =>
		Buffer.concat([
			input.sharedInfo.s2 ?? Buffer.alloc(0),
			input.ephemeralPublicKey.asData({ compressed: true }),
			input.cipher,
		]),
	macFunction: (input: Readonly<{ data: Buffer; key: Buffer }>): Buffer => {
		console.log(`🎉 MACing bytes: ${input.data.toString('hex')}`)
		console.log(
			`🎉🔑 MAC key input: '${input.key.toString('hex')}' END key`,
		)
		const hmac = createHmac('sha256', input.key)
		return hmac.update(input.data).digest()
	},
}

export const simpleECIESEncryptionProcedures: ECIESEncryptProcedures = {
	diffieHellmanRoutine: diffieHellmanPublicKey,
	keyDerivationScheme: SimpleKDF,
	encryptionScheme: AES256CBCEncryption,
	messageAuthenticationCodeScheme: HMACSHA256,
}

export const IVByteCount = 16

export const encrypt = (
	input: Readonly<{
		message: Buffer
		peerPublicKey: PublicKey
		secureRandom?: SecureRandom
	}>,
): Result<ECIESEncryptedMessage, Error> => {
	const secureRandom = input.secureRandom ?? secureRandomGenerator

	const iv = Buffer.from(secureRandom.randomSecureBytes(IVByteCount), 'hex')

	return eciesEncrypt({
		peerPublicKey: input.peerPublicKey,
		M: input.message,
		sharedInfo: <SharedInfo>{
			s2: iv,
		},
		secureRandom,
		setupProcedure: simpleECIESEncryptionProcedures,
	}).map((msg) => ({
		...msg,
		toBuffer: (): Buffer => {
			const ephemeralPublicKeyCompressed = msg.sharedSecret
			const cipherText = msg.cipherText
			const MAC = msg.tag

			let offset = 0
			const serializedCiphertext = Buffer.alloc(
				iv.length +
					1 +
					ephemeralPublicKeyCompressed.length +
					4 +
					cipherText.length +
					MAC.length,
			)

			// IV
			iv.copy(serializedCiphertext, 0)
			offset += iv.length

			// Ephemeral key
			serializedCiphertext.writeUInt8(
				ephemeralPublicKeyCompressed.length,
				offset,
			)
			offset++
			ephemeralPublicKeyCompressed.copy(serializedCiphertext, offset)
			offset += ephemeralPublicKeyCompressed.length

			// Ciphertext
			serializedCiphertext.writeUInt32BE(cipherText.length, offset)
			offset += 4
			cipherText.copy(serializedCiphertext, offset)
			offset += cipherText.length

			// MAC
			MAC.copy(serializedCiphertext, offset)

			return serializedCiphertext
		},
	}))
}

export type ECIESDecryptInput = Readonly<{
	privateKey: PrivateKey
	encryptedMessage: ECIESEncryptedMessage
	setupProcedure: ECIESDecryptProcedures
	sharedInfo?: SharedInfo
}>

/* eslint-disable */
type BufferReader = {
	nextBuffer: (byteCount: number) => Result<Buffer, Error>
}
const makeBufferReader = (buffer: Buffer): BufferReader => {
	let buf = buffer || new Buffer(0)
	if (!Buffer.isBuffer(buf)) throw new Error('A Buffer must be provided')
	let offset = 0

	return {
		nextBuffer: (byteCount: number): Result<Buffer, Error> => {
			if (byteCount < 0)
				return err(new Error(`'byteCount' must be no negative`))
			if (offset + byteCount > buf.length)
				return err(new Error(`Out of buffer's boundary`))
			let bufToReturn = new Buffer(byteCount)
			buf.copy(bufToReturn, 0, offset, offset + byteCount)
			offset += byteCount
			return ok(bufToReturn)
		},
	}
}

/* eslint-enable */
export const simpleECIESDeryptionProcedures: ECIESDecryptProcedures = {
	diffieHellmanRoutine: diffieHellmanPublicKey,
	keyDerivationScheme: SimpleKDF,
	decryptionScheme: AES256CBCDecryption,
	messageAuthenticationCodeScheme: HMACSHA256,
}

export const decrypt = (
	input: Readonly<{
		buffer: Buffer
		privateKey: PrivateKey
		setupProcedure?: ECIESDecryptProcedures
	}>,
): Result<Buffer, Error> => {
	const procedures = input.setupProcedure ?? simpleECIESDeryptionProcedures
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

				console.log(`🔮 
					iv: ${iv.toString('hex')}, 
					ephemeralPubKey: ${sharedSecret.toString('hex')}, 
					cipherText: ${cipherText.toString('hex')}, 
					MAC: ${macBuf.toString('hex')}
				`)

				const encryptedMessage = <ECIESEncryptedMessage>{
					cipherText,
					sharedSecret,
					tag: macBuf,
					toBuffer: () => input.buffer,
				}

				return {
					encryptedMessage,
					privateKey: input.privateKey,
					setupProcedure: procedures,
					sharedInfo: <SharedInfo>{
						s2: iv,
					},
				}
			},
		)
		.andThen(decryptMessage)
}

// export type Decryption
export const decryptMessage = (
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
	/*
	 * 5️⃣
	 * Convert `z` to an octet string `Z` using conversion routine
	 * 💡 OMITTED: we feed `z` into KDF instead.
	 */

	/*
	 * 6️⃣
	 * Use the key derivation function `KDF` to generate keying data `K` of length `enckeylen + mackeylen`
	 * octets from MODIFIED 🗑 `Z` and `[SharedInfo1]`: Z||S1. 🗑
	 * 💡 Modified: pass in methods instead
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

	console.log(
		`👻 hashH: ${K.toString('hex')}\n\nkeyDataE: ${EK.toString(
			'hex',
		)}\n\n,keyDataM: ${MK.toString('hex')}`,
	)

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

	console.log(`🔮 
					expectedMAC: ${expectedMAC.toString('hex')}
					calcilatedMac (D): ${D.toString('hex')}
				`)

	if (!buffersEquals(D, expectedMAC)) return err(new Error('MAC Mismatch'))

	/*
	 * 9️⃣
	 * Use the encryption operation of the symmetric encryption scheme `ENC` to
	 * encrypt MODIFED 🗑 `M` under `EK` as ciphertext `EM`. 🗑
	 * 💡 Modified: We pass in two function, one for building the decryption operation
	 * and one for building input to decrypt.
	 */

	const decryptionFunction = decryptionFunctionBuilder.buildDecryptionFunction({ key: EK, sharedInfo })

	const dataToDecrypt = combineDataIntoCryptInput({ message: EM, sharedInfo })

	const decrypted = decryptionFunction.decrypt({ cipher: dataToDecrypt })

	return ok(decrypted)
}
