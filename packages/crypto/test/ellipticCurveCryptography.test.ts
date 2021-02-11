import {
	privateKeyFromScalar,
	Signature,
	unsignedPlainText,
	publicKeyFromBytes,
	PrivateKey,
	Secp256k1,
	generatePrivateKey,
	generateKeyPair,
} from '../src/_index'

import { UInt256 } from '@radixdlt/uint256'
import { publicKeyFromPrivateKey } from '../src/wrap/publicKeyWrapped'
import { pointOnCurve } from '../src/wrap/ecPointOnCurve'

// TODO CODE DUPLICATION! Move to shared testing only package.
export const signatureFromHexStrings = (input: {
	r: string
	s: string
}): Signature => {
	const r = new UInt256(input.r, 16)
	const s = new UInt256(input.s, 16)
	return {
		r,
		s,
		equals: (other: Signature): boolean => r.eq(other.r) && s.eq(other.s),
	}
}

describe('elliptic curve cryptography', () => {
	it('knows the order of secp256l1', () => {
		expect(Secp256k1.order.toString(10)).toBe(
			'115792089237316195423570985008687907852837564279074904382605163141518161494337',
		)
	})

	it('can securely generate private keys', () => {
		const privateKeys = [...Array(1024)]
			.map((_, i) => generatePrivateKey())
			.map((privateKey: PrivateKey): string => privateKey.toString())
		const uniquePrivateKeys = new Set(privateKeys)
		// Probability of collision is: 2^10/2^256 <=> 1/2^246<=> Very very very very low probability.
		expect(uniquePrivateKeys.size).toBe(privateKeys.length)
	})

	it('should be able to sign messages', async () => {
		const privateKey = privateKeyFromScalar(UInt256.valueOf(1))

		const messageToSign = unsignedPlainText({
			plainText: 'Satoshi Nakamoto',
		})

		const signatureResult = await privateKey.sign(messageToSign)

		const signature = signatureResult._unsafeUnwrap()

		const r = signature.r.toString(16)
		const s = signature.s.toString(16)

		expect(r).toBe(
			'934b1ea10a4b3c1757e2b0c017d0b6143ce3c9a7e6a4a49860d7a6ab210ee3d8',
		)

		expect(s).toBe(
			'2442ce9d2b916064108014783e923ec36b49743e2ffa1c4496f01a512aafd9e5',
		)
	})

	it('should be able to derive publicKey from privateKey', async () => {
		const privateKey = privateKeyFromScalar(UInt256.valueOf(1))

		const publicKeyResult = await privateKey.derivePublicKey()
		const publicKey = publicKeyResult._unsafeUnwrap()

		const compressedPubKey = publicKey
			.asData({ compressed: true })
			.toString('hex')

		expect(compressedPubKey).toBe(
			'0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
		)

		const uncompressedPubKey = publicKey
			.asData({ compressed: false })
			.toString('hex')

		expect(uncompressedPubKey).toBe(
			'0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8',
		)

		const signature = signatureFromHexStrings({
			r:
				'934b1ea10a4b3c1757e2b0c017d0b6143ce3c9a7e6a4a49860d7a6ab210ee3d8',
			s:
				'2442ce9d2b916064108014783e923ec36b49743e2ffa1c4496f01a512aafd9e5',
		})

		const message = unsignedPlainText({
			plainText: 'Satoshi Nakamoto',
		})

		const signatureValidation = publicKey.isValidSignature({
			signature: signature,
			forData: message,
		})

		expect(signatureValidation).toBeTruthy()
	})

	it('can create a publicKey from bytes', () => {
		const publicKeyResult = publicKeyFromBytes(
			Buffer.from(
				'0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
				'hex',
			),
		)

		const publicKey = publicKeyResult._unsafeUnwrap()

		const publicKeyUncompressed = publicKey
			.asData({ compressed: false })
			.toString('hex')

		expect(publicKeyUncompressed).toBe(
			'0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8',
		)
	})

	it('has G', () => {
		const g = Secp256k1.generator
		expect(g.x.toString(16)).toBe(
			'79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
		)
		expect(g.y.toString(16)).toBe(
			'483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8',
		)
	})

	it('G can mult with self', () => {
		const g = Secp256k1.generator
		const one = UInt256.valueOf(1)
		expect(g.multiply(one).equals(g)).toBe(true)
		const pubKey = publicKeyFromPrivateKey({
			privateKey: one,
		})._unsafeUnwrap()
		expect(pubKey.decodeToPointOnCurve().equals(g)).toBe(true)
	})

	it('can do EC multiplication', () => {
		const keyPair = generateKeyPair()._unsafeUnwrap()
		const publicKey = keyPair.publicKey
		const privateKey = keyPair.privateKey
		const pubKeyPoint = publicKey.decodeToPointOnCurve()

		expect(
			Secp256k1.generator
				.multiplyWithPrivateKey(privateKey)
				.equals(pubKeyPoint),
		).toBe(true)
	})

	it('can do EC addition', () => {
		const g = Secp256k1.generator
		const two = UInt256.valueOf(2)
		const three = UInt256.valueOf(3)
		const five = UInt256.valueOf(5)
		const point2G = g.multiply(two)
		const point3G = g.multiply(three)
		const point5GByAddition = point2G.add(point3G)
		const point5GByMultiplication = g.multiply(five)
		expect(point5GByAddition.equals(point5GByMultiplication)).toBe(true)
	})

	it('can construct ECPoint from X and Y', () => {
		const manualG = pointOnCurve({
			x: new UInt256(
				'79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
				16,
			),
			y: new UInt256(
				'483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8',
				16,
			),
		})._unsafeUnwrap()
		expect(manualG.equals(Secp256k1.generator)).toBe(true)
	})

	it('cannot construct points that is not on the curve', () => {
		pointOnCurve({
			x: UInt256.valueOf(1337),
			y: UInt256.valueOf(1337),
		}).match(
			() => {
				throw Error('expected error, but got none')
			},
			(e) => expect(e.message).toBe(`Not point on curve!`),
		)
	})
})
