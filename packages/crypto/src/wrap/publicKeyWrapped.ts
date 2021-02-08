import { UInt256 } from '@radixdlt/uint256'

import { combine, err, ok, Result } from 'neverthrow'
import { curve, ec } from 'elliptic'
import BN from 'bn.js'
import {
	ECPointOnCurve,
	PrivateKey,
	PublicKey,
	Signature,
	UnsignedMessage,
} from '../_types'
import { buffersEquals, ValidationWitness } from '@radixdlt/util'
import { bnFromUInt256, uint256FromBN } from '@radixdlt/primitives'

const secp256k1 = new ec('secp256k1')

const pointFromOther = (other: ECPointOnCurve): curve.short.ShortPoint => {
	const otherX = bnFromUInt256(other.x)
	const otherY = bnFromUInt256(other.y)
	const shortWeirestrassCurve = secp256k1.curve as curve.short
	return shortWeirestrassCurve.point(otherX, otherY)
}

const incorrectImplementationECPointInvalid = new Error(
	'Incorrect implementation, EC point is invalid',
)

const pointOnCurveFromEllipticShortPoint = (
	shortPoint: curve.short.ShortPoint,
): Result<ECPointOnCurve, Error> => {
	const validateOnCurve = (
		somePoint: curve.short.ShortPoint,
	): Result<ValidationWitness, Error> => {
		if (!somePoint.validate()) return err(new Error('Not point on curve!'))
		return ok(<ValidationWitness>{ witness: 'Point is on curve.' })
	}

	const multiplyByScalar = (by: UInt256): ECPointOnCurve => {
					const factorShortPoint = shortPoint.mul(
						bnFromUInt256(by),
					) as curve.short.ShortPoint
					// using recursion here!
					const factorPoint = pointOnCurveFromEllipticShortPoint(
						factorShortPoint,
					)

					// This should not happen, the internals of the EC lib `Elliptic` should always be
					// able to perform multiplication between point and a scalar.
					if (!factorPoint.isOk())
						throw incorrectImplementationECPointInvalid
					return factorPoint.value
				}

	return validateOnCurve(shortPoint).andThen((_) => {
		return combine([
			uint256FromBN(shortPoint.getX()),
			uint256FromBN(shortPoint.getY()),
		]).map((xNy) => {
			const x = xNy[0]
			const y = xNy[1]

			return <ECPointOnCurve>{
				x,
				y,
				equals: (other: ECPointOnCurve): boolean =>
					other.x.eq(x) && other.y.eq(y),
				add: (other: ECPointOnCurve): ECPointOnCurve => {
					const sumShortPoint = shortPoint.add(
						pointFromOther(other),
					) as curve.short.ShortPoint
					// using recursion here!
					const sumPoint = pointOnCurveFromEllipticShortPoint(
						sumShortPoint,
					)

					// This should not happen, the internals of the EC lib `Elliptic` should always be
					// able to perform EC point addition.
					if (!sumPoint.isOk())
						throw incorrectImplementationECPointInvalid
					return sumPoint.value
				},
				multiply: multiplyByScalar,
				multiplyWithPrivateKey: (privateKey: PrivateKey): ECPointOnCurve => multiplyByScalar(privateKey.scalar)
			}
		})
	})
}


// export const pointOnCurve = (input: Readonly<{ 
// 	x: UInt256,
// 	y: UInt256
// }>): Result<ECPointOnCurve, Error> => 

export const generatorPointSecp256k1: ECPointOnCurve = pointOnCurveFromEllipticShortPoint(secp256k1.g as curve.short.ShortPoint)._unsafeUnwrap()

const publicKeyFromEllipticKey = (
	ecKeyPair: ec.KeyPair,
): Result<PublicKey, Error> => {
	const validation = ecKeyPair.validate()

	if (!validation.result) {
		return err(new Error(`Invalid privateKey: ${validation.reason}`))
	}

	const newKeyAsData = (input_: { readonly compressed: boolean }): Buffer =>
		Buffer.from(ecKeyPair.getPublic(input_.compressed, 'array'))

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
		decodeToPointOnCurve: (): Result<ECPointOnCurve, Error> => {
			const shortPoint = ecKeyPair.getPublic() as curve.short.ShortPoint
			return pointOnCurveFromEllipticShortPoint(shortPoint)
		},
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
