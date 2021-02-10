import { ECPointOnCurve, PrivateKey, PublicKey } from '../_types'
import { DiffieHellmanRoutine } from './_types'

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
