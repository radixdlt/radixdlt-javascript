import { UInt256 } from '@radixdlt/uint256'

import { combine, err, ok, Result } from 'neverthrow'
import { curve, ec } from 'elliptic'
import BN from 'bn.js'
import { ECPointOnCurve, PublicKey, Signature, UnsignedMessage } from '../_types'
import { buffersEquals } from '@radixdlt/util'
import { bnFromUInt256, uint256FromBN } from '@radixdlt/primitives'

const secp256k1 = new ec('secp256k1')

const publicKeyFromEllipticKey = (
	ecKeyPair: ec.KeyPair,
): Result<PublicKey, Error> => {
	const validation = ecKeyPair.validate()

	if (!validation.result) {
		return err(new Error(`Invalid privateKey: ${validation.reason}`))
	}

	const newKeyAsData = (input_: { readonly compressed: boolean }): Buffer =>
		Buffer.from(ecKeyPair.getPublic(input_.compressed, 'array'))

	const pointOnCurveFromEllipticShortPoint = (shortPoint: curve.short.ShortPoint): ECPointOnCurve => {
		const x = uint256FromBN(shortPoint.getX())._unsafeUnwrap()
		const y = uint256FromBN(shortPoint.getY())._unsafeUnwrap()

				const pointFromOther = (other: ECPointOnCurve): curve.short.ShortPoint => {
					const otherX =  bnFromUInt256(other.x)
					const otherY =  bnFromUInt256(other.y)
					const shortWeirestrassCurve = secp256k1.curve as curve.short
					return shortWeirestrassCurve.point(otherX, otherY)
				}

	// return combine([
				// uint256FromBN(basePoint.getX()),
				// uint256FromBN(basePoint.getX())
			// ]).map((xNy) => {
				// const x = xNy[0]
				// const y = xNy[1]
				
				return <ECPointOnCurve>{
					x, y,
					equals: (other: ECPointOnCurve): boolean => other.x.eq(x) && other.y.eq(y),
					add: (other: ECPointOnCurve): ECPointOnCurve => { 
						const sumShortPoint = shortPoint.add(pointFromOther(other)) as curve.short.ShortPoint
						// using recursion here!
						return pointOnCurveFromEllipticShortPoint(sumShortPoint)
					},
					multiply: (by: UInt256): ECPointOnCurve => { 
						const factorShortPoint = shortPoint.mul(bnFromUInt256(by)) as curve.short.ShortPoint
						// using recursion here!
						return pointOnCurveFromEllipticShortPoint(factorShortPoint)
					},
				}
			// })
	}

	const publicKey: PublicKey = {
		asData: newKeyAsData,
		isValidSignature: (input_: {
			readonly signature: Signature
			readonly forData: UnsignedMessage
		}): boolean => {
			const unsignedMessage = input_.forData
			const message = unsignedMessage.hasher(unsignedMessage.unhashed)
			const signature = input_.signature
			const r = bnFromUInt256(signature.r)
			const s = bnFromUInt256(signature.s)
			return ecKeyPair.verify(new BN(message), { r, s })
		},
		equals: (other) => {
			const comparePubKeyBytes = (compressed: boolean): boolean => {
				const newKeyBytes = newKeyAsData({ compressed })
				const otherBytes = other.asData({ compressed })
				return buffersEquals(newKeyBytes, otherBytes)
			}
			return comparePubKeyBytes(true) && comparePubKeyBytes(false)
		},
		decodeToPointOnCurve: (): ECPointOnCurve => {
			const shortPoint = ecKeyPair.getPublic() as curve.short.ShortPoint
			return pointOnCurveFromEllipticShortPoint(shortPoint)
		}
	}

	return ok(publicKey)
}


export const publicKeyFromPrivateKey = (input: {
	readonly privateKey: UInt256
}): Result<PublicKey, Error> => {
	return publicKeyFromEllipticKey(
		secp256k1.keyFromPrivate(input.privateKey.toString(16)),
	)
}

export const publicKeyFromBytesValidated = (
	publicKeyBytes: Buffer,
): Result<PublicKey, Error> => {
	return publicKeyFromEllipticKey(secp256k1.keyFromPublic(publicKeyBytes))
}
