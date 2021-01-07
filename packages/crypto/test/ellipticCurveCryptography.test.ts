import {
	privateKeyFromScalar,
	Signature,
	unsignedPlainText,
	publicKeyFromBytes,
} from '../src/_index'

import { UInt256 } from '@radixdlt/uint256'

const signatureFromHexStrings = (input: {
	r: string
	s: string
}): Signature => ({ r: new UInt256(input.r, 16), s: new UInt256(input.s, 16) })

describe('elliptic curve cryptography', () => {
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

		expect(signatureValidation).toBeTruthy
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
