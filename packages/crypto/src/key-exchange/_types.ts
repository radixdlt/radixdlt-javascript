import { ECPointOnCurve, PrivateKey, PublicKey } from '../_types'

export type DiffieHellmanInput = Readonly<{
	ephemeralPublicKey: PublicKey
}>

export type DiffieHellman<I extends DiffieHellmanInput> = (
	input: I,
) => ECPointOnCurve

export type DiffieHellmanEncryptionInput = DiffieHellmanInput &
	Readonly<{
		ephemeralPrivateKey: PrivateKey
		publicKey: PublicKey
	}>

export type DiffieHellmanEncryption = DiffieHellman<DiffieHellmanEncryptionInput>

export type DiffieHellmanDecryptionInput = DiffieHellmanInput &
	Readonly<{
		privateKey: PrivateKey
	}>

export type DiffieHellmanDecryption = DiffieHellman<DiffieHellmanDecryptionInput>
