import { UInt256 } from '@radixdlt/uint256'

import { combine, err, ok, Result } from 'neverthrow'
import { curve, ec } from 'elliptic'
import { ECPointOnCurve, PrivateKey } from '../../_types'
import { ValidationWitness } from '@radixdlt/util'
import { bnFromUInt256, uint256FromBN } from '@radixdlt/primitives'

const thirdPartyLibEllipticSecp256k1 = new ec('secp256k1')

const pointFromCoordinates = (
	input: Readonly<{
		x: UInt256
		y: UInt256
	}>,
): curve.short.ShortPoint => {
	const otherX = bnFromUInt256(input.x)
	const otherY = bnFromUInt256(input.y)
	const shortWeirestrassCurve = thirdPartyLibEllipticSecp256k1.curve as curve.short
	return shortWeirestrassCurve.point(otherX, otherY)
}

const pointFromOther = (other: ECPointOnCurve): curve.short.ShortPoint => {
	return pointFromCoordinates({ x: other.x, y: other.y })
}

const incorrectImplementationECPointInvalid = new Error(
	'Incorrect implementation, EC point is invalid',
)

const ecPointOnCurveFromCoordinates = (
	input: Readonly<{
		x: UInt256
		y: UInt256
		shortPoint?: curve.short.ShortPoint
	}>,
): ECPointOnCurve => {
	const shortPoint = input.shortPoint ?? pointFromCoordinates(input)

	const multiplyByScalar = (by: UInt256): ECPointOnCurve => {
		const factorShortPoint = shortPoint.mul(
			bnFromUInt256(by),
		) as curve.short.ShortPoint
		// using recursion here!
		const factorPoint = pointOnCurveFromEllipticShortPoint(factorShortPoint)

		// This should not happen, the internals of the EC lib `Elliptic` should always be
		// able to perform multiplication between point and a scalar.
		if (!factorPoint.isOk()) throw incorrectImplementationECPointInvalid
		return factorPoint.value
	}

	return {
		x: input.x,
		y: input.y,
		toBuffer: () =>
			Buffer.from(
				[input.x, input.y]
					.map((s) => s.toString(16))
					.reduce((acc, cur) => acc + cur),
				'hex',
			),
		equals: (other: ECPointOnCurve): boolean =>
			other.x.eq(input.x) && other.y.eq(input.y),
		add: (other: ECPointOnCurve): ECPointOnCurve => {
			const sumShortPoint = shortPoint.add(
				pointFromOther(other),
			) as curve.short.ShortPoint
			// using recursion here!
			const sumPoint = pointOnCurveFromEllipticShortPoint(sumShortPoint)

			// This should not happen, the internals of the EC lib `Elliptic` should always be
			// able to perform EC point addition.
			if (!sumPoint.isOk()) throw incorrectImplementationECPointInvalid
			return sumPoint.value
		},
		multiply: multiplyByScalar,
		multiplyWithPrivateKey: (privateKey: PrivateKey): ECPointOnCurve =>
			multiplyByScalar(privateKey.scalar),
	}
}

export const pointOnCurveFromEllipticShortPoint = (
	shortPoint: curve.short.ShortPoint,
): Result<ECPointOnCurve, Error> => {
	const validateOnCurve = (
		somePoint: curve.short.ShortPoint,
	): Result<ValidationWitness, Error> => {
		if (!somePoint.validate()) return err(new Error('Not point on curve!'))
		return ok({ witness: 'Point is on curve.' })
	}
	return validateOnCurve(shortPoint).andThen((_) => {
		return combine([
			uint256FromBN(shortPoint.getX()),
			uint256FromBN(shortPoint.getY()),
		]).map((xNy) => {
			const x = xNy[0]
			const y = xNy[1]
			return ecPointOnCurveFromCoordinates({ x, y, shortPoint })
		})
	})
}

export const pointOnCurve = (
	input: Readonly<{
		x: UInt256
		y: UInt256
	}>,
): Result<ECPointOnCurve, Error> =>
	pointOnCurveFromEllipticShortPoint(pointFromCoordinates(input))
