import {
	privateKeyFromScalar,
	Signature,
	unsignedPlainText,
	publicKeyFromBytes,
	orderOfSecp256k1,
	PrivateKey,
	generatePrivateKey,
} from '../src/_index'

import { UInt256 } from '@radixdlt/uint256'
import { secureRandomGenerator } from '@radixdlt/util'
import { secureRandomUInt256 } from '@radixdlt/primitives'

const signatureFromHexStrings = (input: {
	r: string
	s: string
}): Signature => ({ r: new UInt256(input.r, 16), s: new UInt256(input.s, 16) })

describe('elliptic curve cryptography', () => {

	it('knows the order of secp256l1', () => {
		expect(orderOfSecp256k1.toString(10)).toBe('115792089237316195423570985008687907852837564279074904382605163141518161494337')
	})

	it('foo', () => {
		const randomBytes = secureRandomGenerator.randomSecureBytes(32)
		const randomBytesHex = randomBytes.toString('hex')
		const integer = new UInt256(randomBytesHex, 16)

		expect(randomBytesHex.length).toBe(64)
		expect(integer.gt(0)).toBe(true)
	})

	it('bar', () => {
		const integer = secureRandomUInt256()
		expect(integer.gt(0)).toBe(true)
	})

	it('can securely generate private keys', () => {
		const privateKeys = [...Array(1024)]
			.map((_, i) => generatePrivateKey())
			.map((privateKey: PrivateKey): string => privateKey.toString())
		const uniquePrivateKeys = new Set(privateKeys)
		privateKeys.slice(0, 100).forEach(k => console.log(`PrivateKey: ${k}`))
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
})
