import { err, ok, Result } from 'neverthrow'
import { curve, ec } from 'elliptic'
import BN from 'bn.js'
import { ECPointOnCurve, PrivateKey, PublicKey, Signature } from '../../_types'
import { buffersEquals } from '@radixdlt/util'
import { bnFromUInt256 } from '@radixdlt/primitives'
import { pointOnCurveFromEllipticShortPoint } from './ecPointOnCurve'
import { UInt256 } from '@radixdlt/uint256'

const thirdPartyLibEllipticSecp256k1 = new ec('secp256k1')

// eslint-disable-next-line max-lines-per-function
const publicKeyFromEllipticKey = (
	ecKeyPair: ec.KeyPair,
): Result<PublicKey, Error> => {
	const validation = ecKeyPair.validate()

	if (!validation.result) {
		return err(new Error(`Invalid privateKey: ${validation.reason}`))
	}

	const newKeyAsData = (input: { readonly compressed: boolean }): Buffer =>
		Buffer.from(ecKeyPair.getPublic(input.compressed, 'array'))

	const isValidSignature = (
		input: Readonly<{
			signature: Signature
			hashedMessage: Buffer
		}>,
	): boolean => {
		const message = input.hashedMessage
		const signature = input.signature
		const r = bnFromUInt256(signature.r)
		const s = bnFromUInt256(signature.s)
		return ecKeyPair.verify(new BN(message), { r, s })
	}

	const equals = (other: PublicKey): boolean => {
		const comparePubKeyBytes = (compressed: boolean): boolean => {
			const newKeyBytes = newKeyAsData({ compressed })
			const otherBytes = other.asData({ compressed })
			return buffersEquals(newKeyBytes, otherBytes)
		}
		return comparePubKeyBytes(true) && comparePubKeyBytes(false)
	}

	const publicKey: PublicKey = {
		asData: newKeyAsData,
		toString: (compressed?: boolean): string =>
			newKeyAsData({ compressed: compressed ?? true }).toString('hex'),
		isValidSignature: isValidSignature,
		equals: equals,
		decodeToPointOnCurve: (): ECPointOnCurve => {
			const shortPoint = ecKeyPair.getPublic() as curve.short.ShortPoint
			const pointOnCurveResult = pointOnCurveFromEllipticShortPoint(
				shortPoint,
			)
			if (pointOnCurveResult.isErr())
				throw new Error(
					`Incorrect implementation, should always be able to decode a valid public key
					 into a point on the curve, but got error ${pointOnCurveResult.error.message}`,
				)
			return pointOnCurveResult.value
		},
	}

	return ok(publicKey)
}

export const publicKeyFromPrivateKey = (
	input: Readonly<{
		privateKey: PrivateKey
	}>,
): PublicKey =>
	publicKeyFromPrivateKeyScalar({ scalar: input.privateKey.scalar })

export const publicKeyFromPrivateKeyScalar = (
	input: Readonly<{
		scalar: UInt256
	}>,
): PublicKey => {
	const result = publicKeyFromEllipticKey(
		thirdPartyLibEllipticSecp256k1.keyFromPrivate(
			input.scalar.toString(16),
		),
	)

	if (result.isErr()) {
		throw new Error(
			`Failed to derive public key from private key, this should never happend since you passed in an 'PrivateKey' type value, which should have been validated. You must somehow have bypassed validation, or our implementation is incorrect, which is a fatal error.`,
		)
	}
	return result.value
}

export const publicKeyFromBytesValidated = (
	publicKeyBytes: Buffer,
): Result<PublicKey, Error> => {
	return publicKeyFromEllipticKey(
		thirdPartyLibEllipticSecp256k1.keyFromPublic(publicKeyBytes),
	)
}
