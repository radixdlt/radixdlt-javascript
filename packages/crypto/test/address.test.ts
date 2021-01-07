import { publicKeyFromBytes, addressFromPublicKeyAndMagic } from '../src/_index'

import { magicFromNumber } from '@radixdlt/primitives'

describe('Address', () => {
	it('can be created from a publicKey and radix magix', () => {
		const publicKeyResult = publicKeyFromBytes(
			Buffer.from(
				'0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
				'hex',
			),
		)

		const publicKey = publicKeyResult._unsafeUnwrap()

		const magic = magicFromNumber(1337)

		const address = addressFromPublicKeyAndMagic({
			publicKey: publicKey,
			magic: magic,
		})
		expect(address).toBe(
			'9S8khLHZa6FsyGo634xQo9QwLgSHGpXHHW764D5mPYBcrnfZV6RT',
		)
	})
})
