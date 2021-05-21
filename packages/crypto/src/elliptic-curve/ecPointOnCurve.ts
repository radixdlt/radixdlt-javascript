import { UInt256 } from '@radixdlt/uint256'

import { combine, err, ok, Result } from 'neverthrow'
import { curve, ec } from 'elliptic'
import { ValidationWitness } from '@radixdlt/util'
import { bnFromUInt256, uint256FromBN } from '@radixdlt/primitives'
import { log } from '@radixdlt/util'
import { ECPointOnCurveT, PrivateKeyT } from './_types'

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

const pointFromOther = (other: ECPointOnCurveT): curve.short.ShortPoint =>
	pointFromCoordinates({ x: other.x, y: other.y })

const incorrectImplementationECPointInvalid = new Error(
	'Incorrect implementation, EC point is invalid',
)

const ecPointOnCurveFromCoordinates = (
	input: Readonly<{
		x: UInt256
		y: UInt256
		shortPoint?: curve.short.ShortPoint
	}>,
): ECPointOnCurveT => {
	const shortPoint = input.shortPoint ?? pointFromCoordinates(input)

	const multiplyByScalar = (by: UInt256): ECPointOnCurveT => {
		const factorShortPoint = shortPoint.mul(
			bnFromUInt256(by),
		) as curve.short.ShortPoint
		// using recursion here!
		const factorPoint = __pointOnCurveFromEllipticShortPoint(
			factorShortPoint,
		)

		// This should not happen, the internals of the EC lib `Elliptic` should always be
		// able to perform multiplication between point and a scalar.
		if (!factorPoint.isOk()) throw incorrectImplementationECPointInvalid
		return factorPoint.value
	}

	const toBuffer = (): Buffer =>
		Buffer.from(
			[input.x, input.y]
				.map(s => s.toString(16))
				.reduce((acc, cur) => acc + cur),
			'hex',
		)

	const toString = (): string => toBuffer().toString('hex')

	return {
		x: input.x,
		y: input.y,
		toBuffer,
		toString,
		equals: (other: ECPointOnCurveT): boolean =>
			other.x.eq(input.x) && other.y.eq(input.y),
		add: (other: ECPointOnCurveT): ECPointOnCurveT => {
			const sumShortPoint = shortPoint.add(
				pointFromOther(other),
			) as curve.short.ShortPoint
			// using recursion here!
			const sumPoint = __pointOnCurveFromEllipticShortPoint(sumShortPoint)

			// This should not happen, the internals of the EC lib `Elliptic` should always be
			// able to perform EC point addition.
			if (!sumPoint.isOk()) throw incorrectImplementationECPointInvalid
			return sumPoint.value
		},
		multiply: multiplyByScalar,
		multiplyWithPrivateKey: (privateKey: PrivateKeyT): ECPointOnCurveT =>
			multiplyByScalar(privateKey.scalar),
	}
}

export const __pointOnCurveFromEllipticShortPoint = (
	shortPoint: curve.short.ShortPoint,
): Result<ECPointOnCurveT, Error> => {
	const validateOnCurve = (
		somePoint: curve.short.ShortPoint,
	): Result<ValidationWitness, Error> => {
		if (!somePoint.validate()) return err(new Error('Not point on curve!'))
		return ok({ witness: 'Point is on curve.' })
	}
	return validateOnCurve(shortPoint).andThen(_ =>
		combine([
			uint256FromBN(shortPoint.getX()),
			uint256FromBN(shortPoint.getY()),
		]).map(xNy => {
			const x = xNy[0]
			const y = xNy[1]
			return ecPointOnCurveFromCoordinates({ x, y, shortPoint })
		}),
	)
}

const fromXY = (
	input: Readonly<{
		x: UInt256
		y: UInt256
	}>,
): Result<ECPointOnCurveT, Error> =>
	__pointOnCurveFromEllipticShortPoint(pointFromCoordinates(input))

const fromBuffer = (buffer: Buffer): Result<ECPointOnCurveT, Error> => {
	const expectedByteCount = 64
	if (buffer.length !== expectedByteCount) {
		const errMsg = `Expected #${expectedByteCount} bytes, but got: ${buffer.length}`
		log.error(errMsg)
		return err(new Error(errMsg))
	}
	const xBuf = buffer.slice(0, expectedByteCount / 2)
	const yBuf = buffer.slice(expectedByteCount / 2)
	const x = new UInt256(xBuf.toString('hex'), 16)
	const y = new UInt256(yBuf.toString('hex'), 16)
	return fromXY({ x, y })
}

export const ECPointOnCurve = {
	fromXY,
	fromBuffer,
}
