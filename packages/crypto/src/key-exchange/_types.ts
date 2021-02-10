import { ECPointOnCurve, PrivateKey, PublicKey } from '../_types'

export type DiffieHellmanRoutine = (
	input: Readonly<{
		privateKey: PrivateKey
		publicKey: PublicKey
	}>,
) => ECPointOnCurve
