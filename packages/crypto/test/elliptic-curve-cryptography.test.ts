import { PrivateKey } from '../src'
import { unsignedPlainText } from '../src'
import { UInt256 } from '@radixdlt/primitives'

describe('elliptic curve cryptography', () => {
	it('should be able to sign messages', async () => {
		const privateKey = PrivateKey(UInt256.valueOf(1))

		const messageToSign = unsignedPlainText({
			plainText: 'Satoshi Nakamoto',
		})

		const signatureResult = await privateKey.sign(messageToSign)

		expect(signatureResult._unsafeUnwrap().r.toString(16)).toBe(
			'934b1ea10a4b3c1757e2b0c017d0b6143ce3c9a7e6a4a49860d7a6ab210ee3d8',
		)
	})
})
